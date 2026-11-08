import { Request, Response, NextFunction } from 'express';
import { ServiceService } from '../services/service.service';
import { sendSuccess } from '../utils/response';
import { ServiceRequestType, ServiceRequestStatus } from '@prisma/client';

export class ServiceController {
  static async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const tableId = req.customerSession?.tableId || req.body.tableId;
      const { type } = req.body as { type: ServiceRequestType };
      const request = await ServiceService.createRequest(tableId, type);
      return sendSuccess(res, request, 'Service request sent to staff', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.staff!.restaurantId;
      const status = req.query.status as ServiceRequestStatus | undefined;
      const requests = await ServiceService.getRequests(restaurantId, status);
      return sendSuccess(res, requests, 'Service requests retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: ServiceRequestStatus };
      const updated = await ServiceService.updateStatus(id, status);
      return sendSuccess(res, updated, 'Service request status updated');
    } catch (error) {
      next(error);
    }
  }
}
