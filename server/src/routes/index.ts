import { Router } from 'express';
import authRoutes from './auth.routes';
import tableRoutes from './table.routes';
import menuRoutes from './menu.routes';
import orderRoutes from './order.routes';
import serviceRoutes from './service.routes';
import analyticsRoutes from './analytics.routes';
import restaurantRoutes from './restaurant.routes';
import areaRoutes from './area.routes';
import transactionRoutes from './transaction.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tables', tableRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/service', serviceRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/restaurant', restaurantRoutes);
router.use('/areas', areaRoutes);
router.use('/transactions', transactionRoutes);

// System health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'smart-menu-server',
  });
});

export default router;
