import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { sendSuccess } from '../utils/response';
import { PaymentMethod } from '@prisma/client';

export class TransactionController {
  static async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.staff?.restaurantId;
      const { from, to, paymentMethod, tableId } = req.query;

      const filters = {
        from: from as string | undefined,
        to: to as string | undefined,
        paymentMethod: paymentMethod as PaymentMethod | undefined,
        tableId: tableId as string | undefined,
      };

      const result = await TransactionService.getTransactions(restaurantId, filters);
      return sendSuccess(res, result, 'Transactions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

