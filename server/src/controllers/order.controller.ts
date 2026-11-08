import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { sendSuccess } from '../utils/response';
import { OrderStatus, TableStatus } from '@prisma/client';

export class OrderController {
  static async placeOrder(req: Request, res: Response, next: NextFunction) {
    try {
      // Prioritize exact tableId from the customer request body (Table.id === payload.tableId)
      const tableId = (req.body.tableId || req.customerSession?.tableId) as string;
      const { notes, items } = req.body;

      const order = await OrderService.createOrder({
        tableId,
        notes,
        items,
      });

      return sendSuccess(res, order, 'Order placed successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.staff!.restaurantId;
      const { status, tableId } = req.query;

      const orders = await OrderService.getOrders(restaurantId, {
        status: status as OrderStatus,
        tableId: tableId as string,
      });

      return sendSuccess(res, orders, 'Orders retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getKitchenOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.staff?.restaurantId;
      const orders = await OrderService.getKitchenOrders(restaurantId);
      return sendSuccess(res, orders, 'Kitchen orders retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await OrderService.getOrderById(id);
      return sendSuccess(res, order, 'Order retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getTableOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const tableId = (req.customerSession?.tableId || req.params.tableId) as string;
      const includeRecent = req.query.includeRecent === 'true';
      const orders = await OrderService.getTableActiveOrders(tableId, includeRecent);

      if (req.query.aggregated === 'true') {
        const totalBill = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        const items = orders.flatMap((o) => o.items);
        return sendSuccess(
          res,
          {
            tableId,
            orders,
            totalBill,
            items,
          },
          'Aggregated table orders retrieved'
        );
      }

      return sendSuccess(res, orders, 'Active table orders retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async completeTableOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { tableId } = req.params;
      const targetStatus = (req.body?.status as TableStatus) || TableStatus.AVAILABLE;
      const result = await OrderService.completeTableOrders(tableId, targetStatus);
      return sendSuccess(res, result, `Table orders completed and table status updated to ${targetStatus}`);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: OrderStatus };
      const order = await OrderService.updateOrderStatus(id, status);
      return sendSuccess(res, order, `Order status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  static async acceptOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await OrderService.updateOrderStatus(id, OrderStatus.ACCEPTED);
      return sendSuccess(res, order, 'Order accepted and forwarded to kitchen');
    } catch (error) {
      next(error);
    }
  }

  static async rejectOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await OrderService.updateOrderStatus(id, OrderStatus.REJECTED);
      return sendSuccess(res, order, 'Order rejected');
    } catch (error) {
      next(error);
    }
  }

  static async markPreparing(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await OrderService.updateOrderStatus(id, OrderStatus.PREPARING);
      return sendSuccess(res, order, 'Order marked as preparing in kitchen');
    } catch (error) {
      next(error);
    }
  }

  static async markReady(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await OrderService.updateOrderStatus(id, OrderStatus.READY);
      return sendSuccess(res, order, 'Order marked as ready to serve');
    } catch (error) {
      next(error);
    }
  }

  static async markServed(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await OrderService.updateOrderStatus(id, OrderStatus.SERVED);
      return sendSuccess(res, order, 'Order delivered to table');
    } catch (error) {
      next(error);
    }
  }

  static async completeOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await OrderService.updateOrderStatus(id, OrderStatus.COMPLETED);
      return sendSuccess(res, order, 'Order closed and completed');
    } catch (error) {
      next(error);
    }
  }
}
