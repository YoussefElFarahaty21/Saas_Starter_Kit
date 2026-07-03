import { Request, Response } from 'express';
import { getUsage, getPlanLimit } from '../../services/services/usageService';

export const getTodayUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const count = await getUsage(req.user.userId);
    const limit = getPlanLimit(req.user.plan);
    const remaining = limit === -1 ? -1 : Math.max(0, limit - count);

    res.json({ count, limit, remaining });
  } catch (err) {
    console.error('[getTodayUsage]', err);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
};
