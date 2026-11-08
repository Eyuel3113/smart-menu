import prisma from '../config/db';
import { AppError } from '../utils/response';

export class RestaurantService {
  static async getBranding(restaurantId?: string) {
    let restaurant = null;
    if (restaurantId) {
      restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          id: true,
          name: true,
          currency: true,
          logoUrl: true,
          bannerUrl: true,
          phone: true,
          address: true,
          showReviewShower: true,
          paymentTiming: true,
        },
      });
    }

    if (!restaurant) {
      restaurant = await prisma.restaurant.findFirst({
        select: {
          id: true,
          name: true,
          currency: true,
          logoUrl: true,
          bannerUrl: true,
          phone: true,
          address: true,
          showReviewShower: true,
          paymentTiming: true,
        },
      });
    }

    if (!restaurant) {
      throw new AppError('Restaurant configuration not found', 404);
    }

    return restaurant;
  }

  static async updateBranding(
    restaurantId: string,
    data: {
      name?: string;
      logoUrl?: string | null;
      bannerUrl?: string | null;
      phone?: string | null;
      address?: string | null;
      currency?: string;
      showReviewShower?: boolean;
      paymentTiming?: string;
    }
  ) {
    let targetId = restaurantId;
    if (!targetId) {
      const first = await prisma.restaurant.findFirst({ select: { id: true } });
      if (!first) throw new AppError('Restaurant not found', 404);
      targetId = first.id;
    }

    return prisma.restaurant.update({
      where: { id: targetId },
      data,
      select: {
        id: true,
        name: true,
        currency: true,
        logoUrl: true,
        bannerUrl: true,
        phone: true,
        address: true,
        showReviewShower: true,
        paymentTiming: true,
        updatedAt: true,
      },
    });
  }
}

