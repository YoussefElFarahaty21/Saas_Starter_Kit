import { Router } from 'express';
import {
  getSlackIntegration,
  saveSlackIntegration,
  testSlackIntegration,
} from '../../controllers/controllers/integrationController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

// GET /integrations/slack
router.get('/slack', getSlackIntegration);

// PUT /integrations/slack
router.put('/slack', saveSlackIntegration);

// POST /integrations/slack/test
router.post('/slack/test', testSlackIntegration);

export default router;
