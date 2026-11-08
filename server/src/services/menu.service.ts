import { Prisma } from '@prisma/client';
import prisma from '../config/db';
import { AppError } from '../utils/response';

export class MenuService {
  static async getPublicMenu(restaurantId?: string) {
    let targetRestaurantId = restaurantId;

    if (!targetRestaurantId) {
      const firstRest = await prisma.restaurant.findFirst();
      if (!firstRest) {
        throw new AppError('No restaurant configured', 404);
      }
      targetRestaurantId = firstRest.id;
    }

    const categories = await prisma.category.findMany({
      where: { restaurantId: targetRestaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          orderBy: { name: 'asc' },
        },
      },
    });

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: targetRestaurantId },
      select: { id: true, name: true, currency: true },
    });

    return {
      restaurant,
      categories,
    };
  }

  static async getCategories(restaurantId: string) {
    return prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  }

  static async createCategory(restaurantId: string, name: string, sortOrder = 0) {
    return prisma.category.create({
      data: {
        restaurantId,
        name,
        sortOrder,
      },
    });
  }

  static async updateCategory(id: string, data: { name?: string; sortOrder?: number }) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Category not found', 404);
    }
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  static async deleteCategory(id: string) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Category not found', 404);
    }
    return prisma.category.delete({ where: { id } });
  }

  static async getMenuItems(
    restaurantId: string,
    filters?: { categoryId?: string; search?: string; isAvailable?: boolean }
  ) {
    const where: Prisma.MenuItemWhereInput = {
      restaurantId,
    };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.menuItem.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });
  }

  static async getMenuItemById(id: string) {
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!item) {
      throw new AppError('Menu item not found', 404);
    }

    return item;
  }

  static async createMenuItem(
    restaurantId: string,
    data: {
      categoryId: string;
      name: string;
      description?: string;
      price: number;
      imageUrl?: string;
      isAvailable?: boolean;
    }
  ) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || category.restaurantId !== restaurantId) {
      throw new AppError('Invalid category ID for this restaurant', 400);
    }

    return prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        isAvailable: data.isAvailable ?? true,
      },
    });
  }

  static async updateMenuItem(
    id: string,
    data: Partial<{
      categoryId: string;
      name: string;
      description?: string;
      price: number;
      imageUrl?: string;
      isAvailable?: boolean;
    }>
  ) {
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Menu item not found', 404);
    }

    return prisma.menuItem.update({
      where: { id },
      data: {
        ...(data.categoryId ? { categoryId: data.categoryId } : {}),
        ...(data.name ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
      },
    });
  }

  static async toggleAvailability(id: string, isAvailable?: boolean) {
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) {
      throw new AppError('Menu item not found', 404);
    }

    return prisma.menuItem.update({
      where: { id },
      data: {
        isAvailable: typeof isAvailable === 'boolean' ? isAvailable : !item.isAvailable,
      },
    });
  }

  static async deleteMenuItem(id: string) {
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Menu item not found', 404);
    }

    return prisma.menuItem.delete({ where: { id } });
  }
}
