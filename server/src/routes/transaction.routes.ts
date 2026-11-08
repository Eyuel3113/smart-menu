import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticateStaff } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateStaff);

router.get('/', TransactionController.getTransactions);

export default router;

