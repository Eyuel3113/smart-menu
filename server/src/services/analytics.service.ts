import { OrderStatus, TableStatus, Prisma } from '@prisma/client';
import prisma from '../config/db';

export class AnalyticsService {
  static async getDashboardAnalytics(restaurantId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Today's Completed Orders & Revenue
    const todayOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        id: true,
        totalAmount: true,
        status: true,
      },
    });

    const totalOrdersToday = todayOrders.length;
    const completedOrdersToday = todayOrders.filter((o) => o.status === OrderStatus.COMPLETED);

    let todayGrossRevenue = new Prisma.Decimal(0);
    for (const ord of completedOrdersToday) {
      todayGrossRevenue = todayGrossRevenue.add(ord.totalAmount);
    }

    const averageOrderValueToday =
      completedOrdersToday.length > 0
        ? Number(todayGrossRevenue) / completedOrdersToday.length
        : 0;

    // 2. All-Time Revenue and Order Count
    const allCompletedOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: OrderStatus.COMPLETED,
      },
      select: { totalAmount: true },
    });

    let totalLifetimeRevenue = new Prisma.Decimal(0);
    for (const ord of allCompletedOrders) {
      totalLifetimeRevenue = totalLifetimeRevenue.add(ord.totalAmount);
    }

    // 3. Table Occupancy Breakdown
    const tables = await prisma.table.findMany({
      where: { restaurantId },
      select: { id: true, status: true },
    });

    const tableStats = {
      total: tables.length,
      available: tables.filter((t) => t.status === TableStatus.AVAILABLE).length,
      occupied: tables.filter((t) => t.status === TableStatus.OCCUPIED).length,
      billRequested: tables.filter((t) => t.status === TableStatus.BILL_REQUESTED).length,
      cleaning: tables.filter((t) => t.status === TableStatus.CLEANING).length,
    };

    // 4. Top Selling Dishes (from OrderItems of completed/non-rejected orders)
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          status: { notIn: [OrderStatus.REJECTED] },
        },
      },
      include: {
        menuItem: {
          select: { id: true, name: true, imageUrl: true, price: true },
        },
      },
    });

    const dishAggregates = new Map<
      string,
      { id: string; name: string; imageUrl: string | null; count: number; totalSales: number }
    >();

    for (const item of orderItems) {
      const existing = dishAggregates.get(item.menuItemId) || {
        id: item.menuItem.id,
        name: item.menuItem.name,
        imageUrl: item.menuItem.imageUrl,
        count: 0,
        totalSales: 0,
      };

      existing.count += item.quantity;
      existing.totalSales += Number(item.unitPrice) * item.quantity;
      dishAggregates.set(item.menuItemId, existing);
    }

    const topDishes = Array.from(dishAggregates.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 5. Past 7 Days Revenue Trend
    const past7DaysStart = new Date();
    past7DaysStart.setDate(past7DaysStart.getDate() - 6);
    past7DaysStart.setHours(0, 0, 0, 0);

    const pastOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: OrderStatus.COMPLETED,
        createdAt: { gte: past7DaysStart },
      },
      select: { createdAt: true, totalAmount: true },
    });

    const dailyRevenueMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      dailyRevenueMap[key] = 0;
    }

    for (const ord of pastOrders) {
      const dateKey = ord.createdAt.toISOString().split('T')[0];
      if (dailyRevenueMap[dateKey] !== undefined) {
        dailyRevenueMap[dateKey] += Number(ord.totalAmount);
      }
    }

    const revenueTrends = Object.entries(dailyRevenueMap).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    return {
      overview: {
        todayGrossRevenue: Number(todayGrossRevenue),
        todayOrdersCount: totalOrdersToday,
        todayCompletedCount: completedOrdersToday.length,
        averageOrderValue: Math.round(averageOrderValueToday * 100) / 100,
        totalLifetimeRevenue: Number(totalLifetimeRevenue),
      },
      tableStats,
      topDishes,
      revenueTrends,
    };
  }
}
