import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateStaff, requireRoles } from '../middlewares/auth.middleware';
import { StaffRole } from '@prisma/client';

const router = Router();

router.use(authenticateStaff);
router.use(requireRoles(StaffRole.ADMIN, StaffRole.MANAGER));

router.get('/dashboard', AnalyticsController.getDashboard);

export default router;
