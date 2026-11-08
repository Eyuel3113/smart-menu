import { Request, Response, NextFunction } from 'express';
import { AreaService } from '../services/area.service';
import { sendSuccess } from '../utils/response';

export class AreaController {
  static async getAreas(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.staff?.restaurantId;
      const areas = await AreaService.getAreas(restaurantId);
      return sendSuccess(res, areas, 'Areas retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createArea(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.staff!.restaurantId;
      const area = await AreaService.createArea(restaurantId, req.body);
      return sendSuccess(res, area, 'Area created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateArea(req: Request, res: Response, next: NextFunction) {
    try {
      const areaId = req.params.id;
      const area = await AreaService.updateArea(areaId, req.body);
      return sendSuccess(res, area, 'Area updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteArea(req: Request, res: Response, next: NextFunction) {
    try {
      const areaId = req.params.id;
      const result = await AreaService.deleteArea(areaId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

