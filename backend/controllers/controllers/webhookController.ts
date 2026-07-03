import { Request, Response } from 'express';
import {
  createWebhook as createWebhookService,
  listWebhooks as listWebhooksService,
  deleteWebhook as deleteWebhookService,
  toggleWebhook as toggleWebhookService,
  WEBHOOK_EVENTS,
} from '../../services/services/webhookService';

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

export const createWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, events } = req.body as { url?: string; events?: string[] };

    if (!url || !url.trim()) {
      res.status(400).json({ error: 'Webhook URL is required' });
      return;
    }

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: 'Select at least one event' });
      return;
    }

    const webhook = await createWebhookService(req.user!.userId, url, events);
    res.status(201).json({
      webhook,
      secret: webhook.secret,
      message: 'Webhook created. Copy the secret to verify signatures.',
      supportedEvents: WEBHOOK_EVENTS,
    });
  } catch (err) {
    console.error('[createWebhook]', err);
    res.status(getErrorStatus(err)).json({
      error: getErrorMessage(err, 'Failed to create webhook'),
    });
  }
};

export const listWebhooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhooks = await listWebhooksService(req.user!.userId);
    res.json({ webhooks, supportedEvents: WEBHOOK_EVENTS });
  } catch (err) {
    console.error('[listWebhooks]', err);
    res.status(getErrorStatus(err)).json({
      error: getErrorMessage(err, 'Failed to list webhooks'),
    });
  }
};

export const deleteWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { webhookId } = req.params;
    if (!webhookId) {
      res.status(400).json({ error: 'Webhook ID is required' });
      return;
    }

    await deleteWebhookService(req.user!.userId, webhookId);
    res.json({ message: 'Webhook deleted successfully' });
  } catch (err) {
    console.error('[deleteWebhook]', err);
    res.status(getErrorStatus(err)).json({
      error: getErrorMessage(err, 'Failed to delete webhook'),
    });
  }
};

export const toggleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { webhookId } = req.params;
    if (!webhookId) {
      res.status(400).json({ error: 'Webhook ID is required' });
      return;
    }

    const webhook = await toggleWebhookService(req.user!.userId, webhookId);
    res.json({
      webhook,
      message: webhook.status === 'active' ? 'Webhook resumed' : 'Webhook paused',
    });
  } catch (err) {
    console.error('[toggleWebhook]', err);
    res.status(getErrorStatus(err)).json({
      error: getErrorMessage(err, 'Failed to update webhook'),
    });
  }
};
