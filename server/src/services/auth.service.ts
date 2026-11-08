import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { signStaffToken } from '../utils/jwt';
import { AppError } from '../utils/response';

export class AuthService {
  static async login(email: string, passwordPlain: string) {
    const staff = await prisma.staff.findUnique({
      where: { email },
      include: {
        restaurant: true,
      },
    });

    if (!staff) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(passwordPlain, staff.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = signStaffToken({
      staffId: staff.id,
      restaurantId: staff.restaurantId,
      email: staff.email,
      name: staff.name,
      role: staff.role,
    });

    return {
      token,
      staff: {
        id: staff.id,
        restaurantId: staff.restaurantId,
        restaurantName: staff.restaurant.name,
        currency: staff.restaurant.currency,
        email: staff.email,
        name: staff.name,
        role: staff.role,
      },
    };
  }

  static async getProfile(staffId: string) {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        restaurantId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
      },
    });

    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    return staff;
  }
}
