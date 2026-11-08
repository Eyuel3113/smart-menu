import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { sendSuccess } from '../utils/response';

export class AnalyticsController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.staff!.restaurantId;
      const data = await AnalyticsService.getDashboardAnalytics(restaurantId);
      return sendSuccess(res, data, 'Analytics dashboard data retrieved');
    } catch (error) {
      next(error);
    }
  }
}
