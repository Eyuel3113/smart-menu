import { Request, Response, NextFunction } from 'express';
import { RestaurantService } from '../services/restaurant.service';
import { sendSuccess } from '../utils/response';

export class RestaurantController {
  static async getBranding(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = (req.query.restaurantId as string) || req.staff?.restaurantId;
      const branding = await RestaurantService.getBranding(restaurantId);
      return sendSuccess(res, branding, 'Restaurant branding retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async updateBranding(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.staff!.restaurantId;
      const updated = await RestaurantService.updateBranding(restaurantId, req.body);
      return sendSuccess(res, updated, 'Restaurant branding updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

