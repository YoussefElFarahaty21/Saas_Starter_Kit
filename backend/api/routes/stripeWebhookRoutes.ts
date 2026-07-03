import { Router } from 'express';
import { handleStripeWebhook } from '../../controllers/controllers/stripeWebhookController';

const router = Router();

// POST /webhook/stripe
// Note: raw body parser is applied in server.ts before this route
router.post('/stripe', handleStripeWebhook);

export default router;
