import { Request, Response } from 'express';
import {
  getUserSlackWebhook,
  saveUserSlackWebhook,
  testUserSlackWebhook,
} from '../../services/services/slackService';

const getErrorStatus = (err: unknown): number => {
  if (err && typeof err === 'object' && 'statusCode' in err) {
    return (err as { statusCode: number }).statusCode;
  }
  return 500;
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export const getSlackIntegration = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await getUserSlackWebhook(req.user!.userId);
    res.json(data);
  } catch (err) {
    console.error('[getSlackIntegration]', err);
    res.status(500).json({ error: 'Failed to load Slack integration' });
  }
};

export const saveSlackIntegration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body as { url?: string };

    if (!url || !url.trim()) {
      res.status(400).json({ error: 'Slack webhook URL is required' });
      return;
    }

    if (!url.trim().startsWith('https://hooks.slack.com/')) {
      res.status(400).json({ error: 'URL must be a valid Slack incoming webhook URL' });
      return;
    }

    const data = await saveUserSlackWebhook(req.user!.userId, url);
    res.json({ message: 'Slack webhook saved', ...data });
  } catch (err) {
    console.error('[saveSlackIntegration]', err);
    res.status(getErrorStatus(err)).json({
      error: getErrorMessage(err, 'Failed to save Slack webhook'),
    });
  }
};

export const testSlackIntegration = async (req: Request, res: Response): Promise<void> => {
  try {
    await testUserSlackWebhook(req.user!.userId);
    res.json({ message: 'Test notification sent to Slack' });
  } catch (err) {
    console.error('[testSlackIntegration]', err);
    res.status(getErrorStatus(err)).json({
      error: getErrorMessage(err, 'Failed to send test notification'),
    });
  }
};
