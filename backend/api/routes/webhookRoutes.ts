import { Router } from 'express';
import {
  createWebhook,
  listWebhooks,
  deleteWebhook,
  toggleWebhook,
} from '../../controllers/controllers/webhookController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requirePlan } from '../../middleware/planMiddleware';

const router = Router();

router.use(authMiddleware, requirePlan('enterprise'));

// POST /webhooks
router.post('/', createWebhook);

// GET /webhooks
router.get('/', listWebhooks);

// DELETE /webhooks/:webhookId
router.delete('/:webhookId', deleteWebhook);

// PUT /webhooks/:webhookId/pause
router.put('/:webhookId/pause', toggleWebhook);

export default router;
