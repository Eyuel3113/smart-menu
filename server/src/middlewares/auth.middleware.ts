import { Request, Response, NextFunction } from 'express';
import { StaffRole } from '@prisma/client';
import { verifyStaffToken, StaffJwtPayload } from '../utils/jwt';
import { AppError } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      staff?: StaffJwtPayload;
    }
  }
}

export function authenticateStaff(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token missing or invalid format', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyStaffToken(token);
    req.staff = payload;
    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Invalid or expired authentication token', 401));
  }
}

export function requireRoles(...allowedRoles: StaffRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.staff) {
      return next(new AppError('Unauthorized: Please authenticate first', 401));
    }

    if (!allowedRoles.includes(req.staff.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.staff.role}' is not authorized to access this resource`,
          403
        )
      );
    }

    next();
  };
}
