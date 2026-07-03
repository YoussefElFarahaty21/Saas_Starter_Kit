import { Router } from 'express';
import { getTodayUsage } from '../../controllers/controllers/usageController';

const router = Router();

// GET /usage/today (auth applied in server.ts)
router.get('/today', getTodayUsage);

export default router;
