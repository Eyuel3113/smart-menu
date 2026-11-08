import { Router } from 'express';
import { z } from 'zod';
import { OrderController } from '../controllers/order.controller';
import { authenticateStaff, requireRoles } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { OrderStatus, StaffRole } from '@prisma/client';

const router = Router();

const placeOrderSchema = z.object({
  tableId: z.string().min(1, 'Table ID is required'),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1, 'Menu Item ID is required'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        notes: z.string().optional(),
      })
    )
    .min(1, 'Order must contain at least one item'),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    errorMap: () => ({
      message: 'Status must be one of: PENDING, ACCEPTED, PREPARING, READY, SERVED, REJECTED, COMPLETED',
    }),
  }),
});

// 1. Customer Endpoints
router.post('/', validateBody(placeOrderSchema), OrderController.placeOrder);
router.get('/table/:tableId', OrderController.getTableOrders);

// 2. Staff Protected Endpoints
router.use(authenticateStaff);

// Kitchen specific queue
router.get(
  '/kitchen',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN),
  OrderController.getKitchenOrders
);

// Table order batch completion
router.patch(
  '/table/:tableId/complete',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.WAITER),
  OrderController.completeTableOrders
);

// Workflow state transition shortcuts
router.patch(
  '/:id/accept',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  OrderController.acceptOrder
);
router.patch(
  '/:id/reject',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  OrderController.rejectOrder
);
router.patch(
  '/:id/prepare',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN),
  OrderController.markPreparing
);
router.patch(
  '/:id/ready',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN),
  OrderController.markReady
);
router.patch(
  '/:id/serve',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.WAITER),
  OrderController.markServed
);
router.patch(
  '/:id/complete',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.WAITER),
  OrderController.completeOrder
);

// General CRUD
router.get('/', OrderController.getOrders);
router.get('/:id', OrderController.getOrderById);
router.patch('/:id/status', validateBody(updateStatusSchema), OrderController.updateStatus);

export default router;
