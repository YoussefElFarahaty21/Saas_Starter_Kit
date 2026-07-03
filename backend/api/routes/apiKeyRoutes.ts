import { Router } from 'express';
import {
  generateApiKey,
  listApiKeys,
  revokeApiKey,
} from '../../controllers/controllers/apiKeyController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requirePlan } from '../../middleware/planMiddleware';

const router = Router();

// All API key management routes require authentication
router.use(authMiddleware);

// POST /apikeys — Pro+ only
router.post('/', requirePlan('pro'), generateApiKey);

// GET /apikeys — list keys (Pro+ to view managed keys)
router.get('/', requirePlan('pro'), listApiKeys);

// DELETE /apikeys/:keyId — revoke a key
router.delete('/:keyId', requirePlan('pro'), revokeApiKey);

export default router;
