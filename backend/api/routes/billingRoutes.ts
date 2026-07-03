import { Router } from 'express';
import {
  createSubscription,
  cancelUserSubscription,
  getPlanStatus,
  getInvoices,
} from '../../controllers/controllers/billingController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

// All billing routes require authentication
router.use(authMiddleware);

// POST /billing/subscribe — create Stripe checkout session
router.post('/subscribe', createSubscription);

// POST /billing/cancel — cancel active subscription
router.post('/cancel', cancelUserSubscription);

// GET /billing/status — current plan + subscription info
router.get('/status', getPlanStatus);

// GET /billing/invoices — invoice history
router.get('/invoices', getInvoices);

export default router;
