import { Router } from 'express';
import { z } from 'zod';
import { ServiceController } from '../controllers/service.controller';
import { authenticateStaff } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { ServiceRequestType, ServiceRequestStatus } from '@prisma/client';

const router = Router();

const createRequestSchema = z.object({
  tableId: z.string().min(1, 'Table ID is required'),
  type: z.nativeEnum(ServiceRequestType, {
    errorMap: () => ({ message: 'Type must be CALL_WAITER or REQUEST_BILL' }),
  }),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(ServiceRequestStatus, {
    errorMap: () => ({ message: 'Status must be PENDING, ACKNOWLEDGED, or RESOLVED' }),
  }),
});

// Customer can request waiter or bill
router.post('/', validateBody(createRequestSchema), ServiceController.createRequest);

// Staff management
router.use(authenticateStaff);
router.get('/', ServiceController.getRequests);
router.patch('/:id/status', validateBody(updateStatusSchema), ServiceController.updateStatus);

export default router;
