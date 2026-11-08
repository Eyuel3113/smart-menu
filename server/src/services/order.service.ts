import { OrderStatus, TableStatus, Prisma } from '@prisma/client';
import prisma from '../config/db';
import { AppError } from '../utils/response';
import {
  emitOrderPlaced,
  emitOrderAccepted,
  emitOrderPreparing,
  emitOrderReady,
  emitOrderServed,
  emitOrderRejected,
  emitOrderCompleted,
} from '../sockets/orderEvents';
import { emitTableStatusUpdated } from '../sockets/serviceEvents';

export interface CreateOrderItemInput {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export interface CreateOrderInput {
  tableId: string;
  notes?: string;
  items: CreateOrderItemInput[];
}

export class OrderService {
  static async createOrder(input: CreateOrderInput) {
    const { tableId, notes, items } = input;

    if (!items || items.length === 0) {
      throw new AppError('Order must contain at least one item', 400);
    }

    // 1. Fetch and validate table
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
    });

    if (!table) {
      throw new AppError('Table not found', 404);
    }

    const validatedTableId = table.id;

    // 2. Fetch all menu items from DB to enforce prices securely
    const menuItemIds = items.map((i) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
      },
    });

    const dbItemMap = new Map(dbMenuItems.map((item) => [item.id, item]));

    // 3. Validate availability and calculate total securely
    let calculatedTotal = new Prisma.Decimal(0);
    const orderItemsToCreate: {
      menuItemId: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
      notes?: string;
    }[] = [];

    for (const item of items) {
      const dbItem = dbItemMap.get(item.menuItemId);
      if (!dbItem) {
        throw new AppError(`Item with ID ${item.menuItemId} does not exist in this restaurant`, 400);
      }

      if (!dbItem.isAvailable) {
        throw new AppError(`Dish '${dbItem.name}' is currently unavailable`, 400);
      }

      if (item.quantity < 1) {
        throw new AppError(`Quantity for dish '${dbItem.name}' must be at least 1`, 400);
      }

      const itemTotal = dbItem.price.mul(item.quantity);
      calculatedTotal = calculatedTotal.add(itemTotal);

      orderItemsToCreate.push({
        menuItemId: dbItem.id,
        quantity: item.quantity,
        unitPrice: dbItem.price,
        notes: item.notes,
      });
    }

    // 4. Database Transaction: Create order & set table status to OCCUPIED
    let occupiedTableToEmit: any = null;

    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          restaurantId: table.restaurantId,
          tableId: validatedTableId,
          status: OrderStatus.PENDING,
          totalAmount: calculatedTotal,
          notes,
          items: {
            create: orderItemsToCreate,
          },
        },
        include: {
          table: true,
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      // Update table status to OCCUPIED
      occupiedTableToEmit = await tx.table.update({
        where: { id: table.id },
        data: { status: TableStatus.OCCUPIED },
      });

      return order;
    });

    if (occupiedTableToEmit) {
      emitTableStatusUpdated(occupiedTableToEmit);
    }

    // 5. Emit real-time order placed event
    emitOrderPlaced(createdOrder);

    return createdOrder;
  }

  static async updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    let resetTableToEmit: any = null;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const res = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
        include: {
          table: true,
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      // If order is completed, update table to AVAILABLE if no remaining active orders
      if (newStatus === OrderStatus.COMPLETED) {
        const remainingActive = await tx.order.count({
          where: {
            tableId: order.tableId,
            id: { not: orderId },
            status: { notIn: [OrderStatus.COMPLETED, OrderStatus.REJECTED] },
          },
        });

        if (remainingActive === 0) {
          resetTableToEmit = await tx.table.update({
            where: { id: order.tableId },
            data: { status: TableStatus.AVAILABLE },
          });
        }
      }

      return res;
    });

    if (resetTableToEmit) {
      emitTableStatusUpdated(resetTableToEmit);
    }

    // Broadcast corresponding event based on state transitions
    switch (newStatus) {
      case OrderStatus.ACCEPTED:
        emitOrderAccepted(updatedOrder);
        break;
      case OrderStatus.PREPARING:
        emitOrderPreparing(updatedOrder);
        break;
      case OrderStatus.READY:
        emitOrderReady(updatedOrder);
        break;
      case OrderStatus.SERVED:
        emitOrderServed(updatedOrder);
        break;
      case OrderStatus.REJECTED:
        emitOrderRejected(updatedOrder);
        break;
      case OrderStatus.COMPLETED:
        emitOrderCompleted(updatedOrder);
        break;
    }

    return updatedOrder;
  }

  static async getKitchenOrders(_restaurantId?: string) {
    return prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.ACCEPTED, OrderStatus.PREPARING],
        },
      },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getOrders(
    restaurantId: string,
    filters?: { status?: OrderStatus; tableId?: string }
  ) {
    const where: Prisma.OrderWhereInput = {
      restaurantId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.tableId) {
      where.tableId = filters.tableId;
    }

    return prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });
  }

  static async getOrderById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  static async getTableActiveOrders(tableId: string, includeRecent = false) {
    const orders = await prisma.order.findMany({
      where: {
        tableId,
        status: {
          notIn: [OrderStatus.COMPLETED, OrderStatus.REJECTED],
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        table: true,
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, imageUrl: true, price: true },
            },
          },
        },
      },
    });

    if (orders.length === 0 && includeRecent) {
      const recentCompleted = await prisma.order.findFirst({
        where: {
          tableId,
          status: OrderStatus.COMPLETED,
          updatedAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          table: true,
          items: {
            include: {
              menuItem: {
                select: { id: true, name: true, imageUrl: true, price: true },
              },
            },
          },
        },
      });

      if (recentCompleted) {
        return [recentCompleted];
      }
    }

    return orders;
  }

  static async completeTableOrders(
    tableId: string,
    targetStatus: TableStatus = TableStatus.AVAILABLE
  ) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      throw new AppError('Table not found', 404);
    }

    const activeOrders = await prisma.order.findMany({
      where: {
        tableId,
        status: {
          notIn: [OrderStatus.COMPLETED, OrderStatus.REJECTED],
        },
      },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    const orderIds = activeOrders.map((o) => o.id);

    const { updatedOrders, updatedTable } = await prisma.$transaction(async (tx) => {
      if (orderIds.length > 0) {
        await tx.order.updateMany({
          where: { id: { in: orderIds } },
          data: { status: OrderStatus.COMPLETED },
        });
      }

      const updatedTable = await tx.table.update({
        where: { id: tableId },
        data: { status: targetStatus },
      });

      // Clear any pending or acknowledged service requests for this table
      await tx.serviceRequest.updateMany({
        where: {
          tableId,
          status: { in: ['PENDING', 'ACKNOWLEDGED'] },
        },
        data: { status: 'RESOLVED' },
      });

      const updatedOrders = await tx.order.findMany({
        where: { id: { in: orderIds } },
        include: {
          table: true,
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      return { updatedOrders, updatedTable };
    });

    // Real-time broadcasts
    emitTableStatusUpdated(updatedTable);
    for (const order of updatedOrders) {
      emitOrderCompleted(order);
    }

    return {
      table: updatedTable,
      completedOrdersCount: updatedOrders.length,
      orders: updatedOrders,
    };
  }
}
