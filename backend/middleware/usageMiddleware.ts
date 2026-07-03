import { Request, Response, NextFunction } from 'express';
import { checkUsageLimit, incrementUsage } from '../services/services/usageService';

/**
 * Reusable middleware that enforces plan-based daily API usage limits.
 *
 * Requires authMiddleware to run first (reads plan from req.user).
 *
 * Usage:
 *   router.get('/feature', authMiddleware, checkUsage, handler)
 */
export const checkUsage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { userId, plan } = req.user;
    const result = await checkUsageLimit(userId, plan);

    if (!result.allowed) {
      res.status(429).json({
        message: 'Daily limit reached. Please upgrade your plan.',
        count: result.count,
        limit: result.limit,
      });
      return;
    }

    await incrementUsage(userId);
    next();
  } catch (err) {
    console.error('[checkUsage]', err);
    res.status(500).json({ error: 'Failed to check usage limit' });
  }
};
