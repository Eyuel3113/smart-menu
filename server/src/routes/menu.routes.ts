import { Router } from 'express';
import { z } from 'zod';
import { MenuController } from '../controllers/menu.controller';
import { authenticateStaff, requireRoles } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { StaffRole } from '@prisma/client';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  sortOrder: z.number().int().optional(),
});

const menuItemSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().nullable().optional(),
  price: z.number().positive('Price must be greater than 0'),
  imageUrl: z.string().nullable().optional(),
  isAvailable: z.boolean().optional(),
});

const updateMenuItemSchema = menuItemSchema.partial();

// Public routes for customers
router.get('/public', MenuController.getPublicMenu);
router.get('/items', MenuController.getMenuItems);
router.get('/items/:id', MenuController.getMenuItemById);
router.get('/categories', MenuController.getCategories);

// Staff Protected Routes
router.use(authenticateStaff);

// Category routes
router.post(
  '/categories',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  validateBody(categorySchema),
  MenuController.createCategory
);
router.patch(
  '/categories/:id',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  validateBody(categorySchema.partial()),
  MenuController.updateCategory
);
router.delete(
  '/categories/:id',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  MenuController.deleteCategory
);

// Item routes
router.post(
  '/items',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  validateBody(menuItemSchema),
  MenuController.createMenuItem
);
router.patch(
  '/items/:id',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  validateBody(updateMenuItemSchema),
  MenuController.updateMenuItem
);
router.patch(
  '/items/:id/toggle-availability',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN),
  MenuController.toggleAvailability
);
router.patch(
  '/items/:id/availability',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN),
  MenuController.toggleAvailability
);
router.delete(
  '/items/:id',
  requireRoles(StaffRole.ADMIN, StaffRole.MANAGER),
  MenuController.deleteMenuItem
);

export default router;
