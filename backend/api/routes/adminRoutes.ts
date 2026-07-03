import { Router } from 'express';
import { listUsers, changeUserPlan, suspendUser } from '../../controllers/controllers/adminController';
import { authMiddleware, adminMiddleware } from '../../middleware/authMiddleware';
import { requirePlan } from '../../middleware/planMiddleware';

const router = Router();

// Admin routes require: valid JWT + admin role + enterprise plan
router.use(authMiddleware);
router.use(adminMiddleware);
router.use(requirePlan('enterprise'));

// GET /admin/users — list all users with plan + status
router.get('/users', listUsers);

// PUT /admin/users/:id/plan — manually change a user's plan
router.put('/users/:id/plan', changeUserPlan);

// PUT /admin/users/:id/suspend — suspend or reactivate a user
router.put('/users/:id/suspend', suspendUser);

export default router;
