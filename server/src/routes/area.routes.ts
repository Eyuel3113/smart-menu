import { Router } from 'express';
import { z } from 'zod';
import { AreaController } from '../controllers/area.controller';
import { authenticateStaff, requireRoles } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { StaffRole } from '@prisma/client';

const router = Router();

const createAreaSchema = z.object({
  name: z.string().min(1, 'Area name is required'),
  sortOrder: z.number().int().optional(),
});

const updateAreaSchema = z.object({
  name: z.string().min(1, 'Area name cannot be empty').optional(),
  sortOrder: z.number().int().optional(),
});

router.use(authenticateStaff);

router.get('/', AreaController.getAreas);
router.post(
  '/',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  validateBody(createAreaSchema),
  AreaController.createArea
);
router.patch(
  '/:id',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  validateBody(updateAreaSchema),
  AreaController.updateArea
);
router.delete(
  '/:id',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  AreaController.deleteArea
);

export default router;

