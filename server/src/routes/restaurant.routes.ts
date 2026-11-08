import { Router } from 'express';
import { z } from 'zod';
import { RestaurantController } from '../controllers/restaurant.controller';
import { authenticateStaff, requireRoles } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { StaffRole } from '@prisma/client';

const router = Router();

const updateBrandingSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  logoUrl: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  currency: z.string().min(1).max(5).optional(),
});

// Public branding endpoint for customer & staff UI
router.get('/branding', RestaurantController.getBranding);

// Protected management endpoint
router.patch(
  '/branding',
  authenticateStaff,
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  validateBody(updateBrandingSchema),
  RestaurantController.updateBranding
);

export default router;

