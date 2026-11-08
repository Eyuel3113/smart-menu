import { Request, Response, NextFunction } from 'express';
import { TableService } from '../services/table.service';
import { sendSuccess } from '../utils/response';
import { TableStatus, PaymentMethod } from '@prisma/client';
import prisma from '../config/db';

async function resolveStaffRestaurantId(req: Request): Promise<string> {
  let restaurantId = req.staff?.restaurantId;
  if (req.staff?.staffId) {
    const staffMember = await prisma.staff.findUnique({
      where: { id: req.staff.staffId },
      select: { restaurantId: true },
    });
    if (staffMember?.restaurantId) {
      restaurantId = staffMember.restaurantId;
    }
  }
  if (!restaurantId) {
    const firstRestaurant = await prisma.restaurant.findFirst({ select: { id: true } });
    if (firstRestaurant) {
      restaurantId = firstRestaurant.id;
    }
  }
  return restaurantId || '';
}

export class TableController {
  static async validateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const tableId = (req.params.id || req.body.tableId) as string;
      const token = (req.query.token || req.body.token) as string;
      const result = await TableService.validateTableToken(tableId, token);
      return sendSuccess(res, result, 'Table token validated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getTables(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = await resolveStaffRestaurantId(req);
      const areaId = req.query.areaId as string | undefined;
      const result = await TableService.getTables(restaurantId, areaId);
      return sendSuccess(res, result, 'Tables retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getTableById(req: Request, res: Response, next: NextFunction) {
    try {
      const tableId = req.params.id;
      const table = await TableService.getTableById(tableId);
      return sendSuccess(res, table, 'Table details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const tableId = req.params.id;
      const { status } = req.body as { status: TableStatus };
      const updated = await TableService.updateTableStatus(tableId, status);
      return sendSuccess(res, updated, 'Table status updated');
    } catch (error) {
      next(error);
    }
  }

  static async createTable(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = await resolveStaffRestaurantId(req);
      const { tableNumber, areaId, capacity } = req.body;
      const table = await TableService.createTable(restaurantId, {
        tableNumber: Number(tableNumber),
        areaId: areaId || null,
        capacity: capacity ? Number(capacity) : undefined,
      });
      return sendSuccess(res, table, 'Table created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateTable(req: Request, res: Response, next: NextFunction) {
    try {
      const tableId = req.params.id;
      const { tableNumber, areaId, capacity } = req.body;
      const table = await TableService.updateTable(tableId, {
        tableNumber: tableNumber !== undefined ? Number(tableNumber) : undefined,
        areaId,
        capacity: capacity !== undefined ? Number(capacity) : undefined,
      });
      return sendSuccess(res, table, 'Table updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteTable(req: Request, res: Response, next: NextFunction) {
    try {
      const tableId = req.params.id;
      const result = await TableService.deleteTable(tableId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async regenerateQr(req: Request, res: Response, next: NextFunction) {
    try {
      const tableId = req.params.id;
      const table = await TableService.regenerateTableQr(tableId);
      return sendSuccess(res, table, 'Table QR regenerated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async payTable(req: Request, res: Response, next: NextFunction) {
    try {
      const tableId = req.params.id;
      const { paymentMethod, referenceNote } = req.body as {
        paymentMethod: PaymentMethod;
        referenceNote?: string;
      };
      const result = await TableService.payTable(tableId, { paymentMethod, referenceNote });
      return sendSuccess(res, result, 'Payment submitted. Awaiting manager clearance.');
    } catch (error) {
      next(error);
    }
  }

  static async approveSettlement(req: Request, res: Response, next: NextFunction) {
    try {
      const tableId = req.params.id;
      const staffId = req.staff?.staffId;
      const updated = await TableService.approveSettlement(tableId, staffId);
      return sendSuccess(res, updated, 'Table session concluded and moved to cleaning');
    } catch (error) {
      next(error);
    }
  }
}
