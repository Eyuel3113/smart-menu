import { PaymentMethod, PaymentStatus } from '@prisma/client';
import prisma from '../config/db';

export interface TransactionFilter {
  from?: string;
  to?: string;
  paymentMethod?: PaymentMethod;
  tableId?: string;
}

export class TransactionService {
  static async getTransactions(restaurantId?: string, filters: TransactionFilter = {}) {
    let targetRestaurantId = restaurantId;
    if (!targetRestaurantId) {
      const rest = await prisma.restaurant.findFirst({ select: { id: true } });
      if (rest) targetRestaurantId = rest.id;
    }

    const where: any = {};
    if (targetRestaurantId) {
      where.restaurantId = targetRestaurantId;
    }

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters.tableId) {
      where.tableId = filters.tableId;
    }

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) {
        where.createdAt.gte = new Date(filters.from);
      }
      if (filters.to) {
        const toDate = new Date(filters.to);
        if (filters.to.length <= 10) {
          toDate.setHours(23, 59, 59, 999);
        }
        where.createdAt.lte = toDate;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        table: {
          select: {
            id: true,
            tableNumber: true,
            area: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const totalRevenue = transactions
      .filter((t) => t.status === PaymentStatus.COMPLETED)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const transactionCount = transactions.length;
    const averageTicket = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    return {
      transactions,
      stats: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        transactionCount,
        averageTicket: Math.round(averageTicket * 100) / 100,
      },
    };
  }

  static async createTransaction(data: {
    restaurantId: string;
    tableId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status?: PaymentStatus;
    referenceNote?: string;
    orderIds: string[];
    itemSnapshot: any;
    settledByStaffId?: string;
  }) {
    return prisma.transaction.create({
      data: {
        restaurantId: data.restaurantId,
        tableId: data.tableId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status: data.status || PaymentStatus.COMPLETED,
        referenceNote: data.referenceNote,
        orderIds: data.orderIds,
        itemSnapshot: data.itemSnapshot,
        settledByStaffId: data.settledByStaffId,
      },
      include: {
        table: {
          select: { id: true, tableNumber: true },
        },
      },
    });
  }
}

