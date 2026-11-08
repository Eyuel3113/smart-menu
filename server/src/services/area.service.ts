import prisma from '../config/db';
import { AppError } from '../utils/response';

export class AreaService {
  static async getAreas(restaurantId?: string) {
    let targetRestaurantId = restaurantId;
    if (!targetRestaurantId) {
      const rest = await prisma.restaurant.findFirst({ select: { id: true } });
      if (rest) targetRestaurantId = rest.id;
    }

    const where: any = {};
    if (targetRestaurantId) {
      where.restaurantId = targetRestaurantId;
    }

    return prisma.area.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { tables: true },
        },
      },
    });
  }

  static async createArea(restaurantId: string, data: { name: string; sortOrder?: number }) {
    let targetRestaurantId = restaurantId;
    if (!targetRestaurantId) {
      const rest = await prisma.restaurant.findFirst({ select: { id: true } });
      if (!rest) throw new AppError('Restaurant not found', 404);
      targetRestaurantId = rest.id;
    }

    return prisma.area.create({
      data: {
        restaurantId: targetRestaurantId,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
      },
      include: {
        _count: {
          select: { tables: true },
        },
      },
    });
  }

  static async updateArea(areaId: string, data: { name?: string; sortOrder?: number }) {
    const existing = await prisma.area.findUnique({ where: { id: areaId } });
    if (!existing) throw new AppError('Area not found', 404);

    return prisma.area.update({
      where: { id: areaId },
      data,
      include: {
        _count: {
          select: { tables: true },
        },
      },
    });
  }

  static async deleteArea(areaId: string) {
    const existing = await prisma.area.findUnique({ where: { id: areaId } });
    if (!existing) throw new AppError('Area not found', 404);

    await prisma.table.updateMany({
      where: { areaId },
      data: { areaId: null },
    });

    await prisma.area.delete({
      where: { id: areaId },
    });

    return { success: true, message: `Area '${existing.name}' deleted successfully` };
  }
}

