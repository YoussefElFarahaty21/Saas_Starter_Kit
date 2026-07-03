import { Router } from 'express';
import {
  createTeam,
  inviteMember,
  getMembers,
  removeMember,
  acceptInvite,
} from '../../controllers/controllers/teamController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requirePlan } from '../../middleware/planMiddleware';
import { checkUsage } from '../../middleware/usageMiddleware';

const router = Router();

// Public — accept invite via email link
// GET /team/invite/accept?token=xxx
router.get('/invite/accept', acceptInvite);

// Any authenticated user can view teams they belong to
router.get('/members', authMiddleware, getMembers);

// Owner actions require Pro+
router.post('/create', authMiddleware, requirePlan('pro'), createTeam);
router.post('/invite', authMiddleware, requirePlan('pro'), checkUsage, inviteMember);
router.delete('/members/:memberId', authMiddleware, requirePlan('pro'), removeMember);

export default router;
