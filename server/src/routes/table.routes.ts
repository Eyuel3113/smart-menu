import { Router } from 'express';
import { z } from 'zod';
import { TableController } from '../controllers/table.controller';
import { authenticateStaff, requireRoles } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { StaffRole, TableStatus, PaymentMethod } from '@prisma/client';

const router = Router();

const statusSchema = z.object({
  status: z.nativeEnum(TableStatus, {
    errorMap: () => ({
      message: 'Status must be one of: AVAILABLE, OCCUPIED, BILL_REQUESTED, PAID_PENDING, CLEANING',
    }),
  }),
});

const createTableSchema = z.object({
  tableNumber: z.number().int().positive('Table number must be positive integer'),
  areaId: z.string().nullable().optional(),
  capacity: z.number().int().positive().optional(),
});

const updateTableSchema = z.object({
  tableNumber: z.number().int().positive('Table number must be positive integer').optional(),
  areaId: z.string().nullable().optional(),
  capacity: z.number().int().positive().optional(),
});

const payTableSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({
      message: 'Payment method must be one of: CASH, TELEBIRR, CBE_BIRR, POS_CARD',
    }),
  }),
  referenceNote: z.string().optional(),
});

// Public customer routes
router.get('/:id/validate', TableController.validateToken);
router.post('/validate', TableController.validateToken);
router.get('/:id/public', TableController.getTableById);
router.post('/:id/pay', validateBody(payTableSchema), TableController.payTable);

// Staff Protected routes
router.use(authenticateStaff);

router.get('/', TableController.getTables);
router.get('/:id', TableController.getTableById);
router.patch('/:id/status', validateBody(statusSchema), TableController.updateStatus);
router.patch(
  '/:id',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  validateBody(updateTableSchema),
  TableController.updateTable
);
router.delete(
  '/:id',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  TableController.deleteTable
);
router.post(
  '/',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  validateBody(createTableSchema),
  TableController.createTable
);
router.post(
  '/:id/regenerate-qr',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  TableController.regenerateQr
);
router.patch(
  '/:id/approve-settlement',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  TableController.approveSettlement
);

export default router;
