import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  completeOnboarding,
  updatePreferences,
} from '../../controllers/controllers/userController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// GET /user/profile
router.get('/profile', getProfile);

// PUT /user/profile
router.put('/profile', updateProfile);

// PUT /user/password
router.put('/password', changePassword);

// PUT /user/onboarding
router.put('/onboarding', completeOnboarding);

// PUT /user/preferences
router.put('/preferences', updatePreferences);

// DELETE /user/account
router.delete('/account', deleteAccount);

export default router;
