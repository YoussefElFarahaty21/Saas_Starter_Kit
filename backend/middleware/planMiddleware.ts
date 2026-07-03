import { Request, Response, NextFunction } from 'express';
import { getPlanLevel, Plan } from '../services/services/planService';
import { getUserById } from '../services/services/userService';

/**
 * Higher-order function that returns Express middleware guarding a route
 * by minimum subscription plan level (reads live plan from Firestore).
 *
 * Usage:
 *   router.get('/feature', authMiddleware, requirePlan('pro'), handler)
 */
export const requirePlan = (minPlan: Plan) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await getUserById(req.user.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user.plan = user.plan;
    req.user.role = user.role;

    const userLevel = getPlanLevel(user.plan);
    const requiredLevel = getPlanLevel(minPlan);

    if (userLevel < requiredLevel) {
      res.status(403).json({
        error: 'Upgrade required',
        requiredPlan: minPlan,
        currentPlan: user.plan,
      });
      return;
    }

    next();
  };
};
