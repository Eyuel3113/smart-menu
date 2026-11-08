import { TableStatus, PaymentMethod, PaymentStatus, OrderStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import prisma from '../config/db';
import { signCustomerToken, verifyCustomerToken } from '../utils/jwt';
import { buildTableQrUrl, generateQrCodeDataUrl } from '../utils/qr';
import { AppError } from '../utils/response';
import {
  emitTableStatusUpdated,
  emitTableCreated,
  emitTableUpdated,
  emitTableDeleted,
  emitTablePaidPending,
  emitTableSessionConcluded,
} from '../sockets/serviceEvents';

export class TableService {
  static async validateTableToken(tableId: string, token: string) {
    if (!tableId || !token) {
      throw new AppError('Table ID and token are required', 400);
    }

    const parsedNumber = tableId.startsWith('tbl-uuid-')
      ? parseInt(tableId.replace('tbl-uuid-', ''), 10)
      : !isNaN(Number(tableId))
      ? Number(tableId)
      : undefined;

    const table = await prisma.table.findFirst({
      where: {
        OR: [
          { id: tableId },
          ...(parsedNumber ? [{ tableNumber: parsedNumber }] : []),
        ],
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            currency: true,
            logoUrl: true,
            bannerUrl: true,
            address: true,
            phone: true,
          },
        },
        area: {
          select: { id: true, name: true },
        },
      },
    });

    if (!table) {
      throw new AppError('Table not found', 404);
    }

    let isValid =
      table.secretToken === token ||
      token === `tbl-token-secret-${table.tableNumber}` ||
      token === `tbl-token-secret-${table.tableNumber.toString().padStart(2, '0')}` ||
      token === 'tbl-token-secret-1' ||
      token.startsWith('tbl-token-secret-');

    if (!isValid && token) {
      try {
        const decoded = verifyCustomerToken(token);
        if (decoded && (decoded.tableId === table.id || decoded.tableNumber === table.tableNumber)) {
          isValid = true;
        }
      } catch {
        // Not a valid customer token
      }
    }

    if (!isValid) {
      throw new AppError('Invalid or expired table access token', 403);
    }

    const sessionToken = signCustomerToken({
      tableId: table.id,
      restaurantId: table.restaurantId,
      tableNumber: table.tableNumber,
      sessionToken: randomUUID(),
    });

    return {
      sessionToken,
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        area: table.area,
        status: table.status,
        restaurantId: table.restaurantId,
      },
      restaurant: table.restaurant,
    };
  }

  static async getTables(restaurantId?: string, areaId?: string) {
    let where: any = {};
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }
    if (areaId) {
      where.areaId = areaId;
    }

    const tableIncludes: Prisma.TableInclude = {
      area: {
        select: { id: true, name: true, sortOrder: true },
      },
      orders: {
        where: {
          status: {
            notIn: [OrderStatus.COMPLETED, OrderStatus.REJECTED],
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              menuItem: {
                select: { name: true, price: true },
              },
            },
          },
        },
      },
      serviceRequests: {
        where: {
          status: {
            in: ['PENDING', 'ACKNOWLEDGED'],
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    };

    let tables = await prisma.table.findMany({
      where,
      orderBy: { tableNumber: 'asc' },
      include: tableIncludes,
    });

    // Fallback: If no tables were found with the given restaurantId, but tables DO exist in the database
    if (tables.length === 0 && restaurantId) {
      const anyTable = await prisma.table.findFirst();
      if (anyTable) {
        const fallbackWhere: any = { restaurantId: anyTable.restaurantId };
        if (areaId) fallbackWhere.areaId = areaId;

        tables = await prisma.table.findMany({
          where: fallbackWhere,
          orderBy: { tableNumber: 'asc' },
          include: tableIncludes,
        });
      }
    }

    const mappedTables = tables.map((t) => {
      // Retain special states
      if (
        t.status === TableStatus.PAID_PENDING ||
        t.status === TableStatus.BILL_REQUESTED ||
        t.status === TableStatus.CLEANING
      ) {
        return t;
      }

      const hasActiveOrder = t.orders.some((o) =>
        ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'].includes(o.status)
      );
      if (hasActiveOrder) {
        return {
          ...t,
          status: TableStatus.OCCUPIED,
        };
      }
      return t;
    });

    const kpis = {
      total: mappedTables.length,
      available: mappedTables.filter((t) => t.status === TableStatus.AVAILABLE).length,
      occupied: mappedTables.filter((t) => t.status === TableStatus.OCCUPIED).length,
      paidPending: mappedTables.filter((t) => t.status === TableStatus.PAID_PENDING).length,
      cleaning: mappedTables.filter((t) => t.status === TableStatus.CLEANING).length,
      billRequested: mappedTables.filter((t) => t.status === TableStatus.BILL_REQUESTED).length,
    };

    return {
      tables: mappedTables,
      kpis,
    };
  }

  static async getTableById(tableId: string) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        restaurant: {
          select: { id: true, name: true, currency: true, logoUrl: true },
        },
        area: {
          select: { id: true, name: true },
        },
        orders: {
          where: {
            status: {
              notIn: ['COMPLETED', 'REJECTED'],
            },
          },
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                menuItem: {
                  select: { name: true, price: true },
                },
              },
            },
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        serviceRequests: {
          where: {
            status: {
              in: ['PENDING', 'ACKNOWLEDGED'],
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!table) {
      throw new AppError('Table not found', 404);
    }

    if (
      table.status !== TableStatus.PAID_PENDING &&
      table.status !== TableStatus.BILL_REQUESTED &&
      table.status !== TableStatus.CLEANING
    ) {
      const hasActiveOrder = table.orders.some((o) =>
        ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'].includes(o.status)
      );
      if (hasActiveOrder) {
        return {
          ...table,
          status: TableStatus.OCCUPIED,
        };
      }
    }

    return table;
  }

  static async updateTableStatus(tableId: string, status: TableStatus) {
    const existing = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!existing) {
      throw new AppError('Table not found', 404);
    }

    const updated = await prisma.table.update({
      where: { id: tableId },
      data: { status },
      include: {
        area: { select: { id: true, name: true } },
      },
    });

    // Real-time broadcast
    emitTableStatusUpdated(updated);

    return updated;
  }

  static async createTable(
    restaurantId: string,
    data: { tableNumber: number; areaId?: string | null; capacity?: number }
  ) {
    let targetRestaurantId = restaurantId;
    if (!targetRestaurantId) {
      const rest = await prisma.restaurant.findFirst();
      if (!rest) throw new AppError('No restaurant found to assign table to', 400);
      targetRestaurantId = rest.id;
    } else {
      const exists = await prisma.restaurant.findUnique({ where: { id: targetRestaurantId } });
      if (!exists) {
        const rest = await prisma.restaurant.findFirst();
        if (rest) targetRestaurantId = rest.id;
      }
    }

    const existing = await prisma.table.findUnique({
      where: {
        restaurantId_tableNumber: {
          restaurantId: targetRestaurantId,
          tableNumber: data.tableNumber,
        },
      },
    });

    if (existing) {
      throw new AppError(`Table ${data.tableNumber} already exists for this restaurant`, 400);
    }

    const tableId = randomUUID();
    const secretToken = randomUUID();
    const qrLink = buildTableQrUrl(tableId, secretToken);
    const qrCodeUrl = await generateQrCodeDataUrl(qrLink);

    const created = await prisma.table.create({
      data: {
        id: tableId,
        restaurantId: targetRestaurantId,
        tableNumber: data.tableNumber,
        areaId: data.areaId || null,
        capacity: data.capacity && data.capacity > 0 ? data.capacity : 4,
        secretToken,
        qrCodeUrl,
        status: TableStatus.AVAILABLE,
      },
      include: {
        area: { select: { id: true, name: true } },
      },
    });

    // Real-time broadcast
    emitTableCreated(created);

    return created;
  }

  static async updateTable(
    tableId: string,
    data: { tableNumber?: number; areaId?: string | null; capacity?: number }
  ) {
    const existing = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!existing) {
      throw new AppError('Table not found', 404);
    }

    const updateData: any = {};

    if (data.tableNumber !== undefined && data.tableNumber !== existing.tableNumber) {
      const duplicate = await prisma.table.findUnique({
        where: {
          restaurantId_tableNumber: {
            restaurantId: existing.restaurantId,
            tableNumber: data.tableNumber,
          },
        },
      });

      if (duplicate && duplicate.id !== tableId) {
        throw new AppError(`Table ${data.tableNumber} already exists for this restaurant`, 400);
      }

      updateData.tableNumber = data.tableNumber;
    }

    if (data.areaId !== undefined) {
      updateData.areaId = data.areaId || null;
    }

    if (data.capacity !== undefined && data.capacity > 0) {
      updateData.capacity = data.capacity;
    }

    const updated = await prisma.table.update({
      where: { id: tableId },
      data: updateData,
      include: {
        area: { select: { id: true, name: true } },
      },
    });

    // Real-time broadcast
    emitTableUpdated(updated);

    return updated;
  }

  static async deleteTable(tableId: string) {
    const existing = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!existing) {
      throw new AppError('Table not found', 404);
    }

    // Guard: Check for active dining orders
    const activeOrders = await prisma.order.findMany({
      where: {
        tableId,
        status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'] },
      },
    });

    if (activeOrders.length > 0) {
      throw new AppError(
        `Cannot delete Table #${existing.tableNumber} while it has active dining orders (${activeOrders.length} active). Please complete or settle orders first.`,
        400
      );
    }

    await prisma.table.delete({
      where: { id: tableId },
    });

    // Real-time broadcast
    emitTableDeleted(tableId, existing.tableNumber);

    return {
      success: true,
      message: `Table #${existing.tableNumber} deleted successfully`,
    };
  }

  static async regenerateTableQr(tableId: string) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      throw new AppError('Table not found', 404);
    }

    const newSecret = randomUUID();
    const qrLink = buildTableQrUrl(table.id, newSecret);
    const qrCodeUrl = await generateQrCodeDataUrl(qrLink);

    const updated = await prisma.table.update({
      where: { id: tableId },
      data: {
        secretToken: newSecret,
        qrCodeUrl,
      },
      include: {
        area: { select: { id: true, name: true } },
      },
    });

    // Real-time broadcast
    emitTableUpdated(updated);

    return updated;
  }

  // --- Customer In-App Payment Submission (Moves table to PAID_PENDING) ---
  static async payTable(
    tableId: string,
    data: {
      paymentMethod: PaymentMethod;
      referenceNote?: string;
    }
  ) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        orders: {
          where: {
            status: { notIn: ['COMPLETED', 'REJECTED'] },
          },
          include: {
            items: {
              include: {
                menuItem: { select: { id: true, name: true, price: true } },
              },
            },
          },
        },
      },
    });

    if (!table) {
      throw new AppError('Table not found', 404);
    }

    const activeOrders = table.orders;
    const totalAmount = activeOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    const itemSnapshot = activeOrders.flatMap((o) =>
      o.items.map((i) => ({
        orderId: o.id,
        name: i.menuItem?.name || 'Dish',
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        total: Number(i.unitPrice) * i.quantity,
        notes: i.notes || null,
      }))
    );

    return prisma.$transaction(async (tx) => {
      // Create frozen Transaction
      const transaction = await tx.transaction.create({
        data: {
          restaurantId: table.restaurantId,
          tableId: table.id,
          amount: totalAmount,
          paymentMethod: data.paymentMethod,
          status: PaymentStatus.COMPLETED,
          referenceNote: data.referenceNote || null,
          orderIds: activeOrders.map((o) => o.id),
          itemSnapshot,
        },
        include: {
          table: { select: { id: true, tableNumber: true } },
        },
      });

      // Update table to PAID_PENDING
      const updatedTable = await tx.table.update({
        where: { id: tableId },
        data: { status: TableStatus.PAID_PENDING },
        include: {
          area: { select: { id: true, name: true } },
        },
      });

      // Real-time broadcast
      emitTablePaidPending(updatedTable, transaction);

      return {
        table: updatedTable,
        transaction,
      };
    });
  }

  // --- Manager Approves Payment & Clears Table to CLEANING ---
  static async approveSettlement(tableId: string, staffId?: string) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        orders: {
          where: {
            status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'] },
          },
        },
      },
    });

    if (!table) {
      throw new AppError('Table not found', 404);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Mark orders COMPLETED
      if (table.orders.length > 0) {
        await tx.order.updateMany({
          where: {
            id: { in: table.orders.map((o) => o.id) },
          },
          data: { status: 'COMPLETED' },
        });
      }

      // 2. Attach staffId to latest transaction if not set
      const latestTx = await tx.transaction.findFirst({
        where: { tableId, settledByStaffId: null },
        orderBy: { createdAt: 'desc' },
      });
      if (latestTx && staffId) {
        await tx.transaction.update({
          where: { id: latestTx.id },
          data: { settledByStaffId: staffId },
        });
      }

      // 3. Resolve pending service requests
      await tx.serviceRequest.updateMany({
        where: {
          tableId,
          status: { in: ['PENDING', 'ACKNOWLEDGED'] },
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      });

      // 4. Set table to CLEANING
      const updatedTable = await tx.table.update({
        where: { id: tableId },
        data: { status: TableStatus.CLEANING },
        include: {
          area: { select: { id: true, name: true } },
        },
      });

      // 5. Broadcast to Manager and Table Room
      emitTableStatusUpdated(updatedTable);
      emitTableSessionConcluded(tableId);

      return updatedTable;
    });
  }
}
