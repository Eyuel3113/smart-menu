import { Request, Response, NextFunction } from 'express';
import { verifyCustomerToken, CustomerJwtPayload } from '../utils/jwt';
import { AppError } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      customerSession?: CustomerJwtPayload;
    }
  }
}

export function authenticateTableSession(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const headerToken = req.headers['x-table-token'] as string | undefined;
    const queryToken = req.query.token as string | undefined;

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (headerToken) {
      token = headerToken;
    } else if (queryToken) {
      token = queryToken;
    }

    if (!token) {
      throw new AppError('Customer table session token required', 401);
    }

    const session = verifyCustomerToken(token);
    req.customerSession = session;
    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Invalid or expired table session token', 401));
  }
}
