import { Request, Response } from 'express';
import {
  generateApiKey as generateApiKeyService,
  listApiKeys as listApiKeysService,
  revokeApiKey as revokeApiKeyService,
} from '../../services/services/apiKeyService';

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

export const generateApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { label } = req.body as { label?: string };

    if (!label || !label.trim()) {
      res.status(400).json({ error: 'Label is required' });
      return;
    }

    const apiKey = await generateApiKeyService(req.user!.userId, label);

    res.status(201).json({
      apiKey,
      key: apiKey.key,
      message: 'API key created. You can copy it anytime from your API keys list.',
    });
  } catch (err) {
    console.error('[generateApiKey]', err);
    res.status(getErrorStatus(err)).json({
      error: getErrorMessage(err, 'Failed to generate API key'),
    });
  }
};

export const listApiKeys = async (req: Request, res: Response): Promise<void> => {
  try {
    const apiKeys = await listApiKeysService(req.user!.userId);
    res.json({ apiKeys });
  } catch (err) {
    console.error('[listApiKeys]', err);
    res.status(getErrorStatus(err)).json({
      error: getErrorMessage(err, 'Failed to list API keys'),
    });
  }
};

export const revokeApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyId } = req.params;

    if (!keyId) {
      res.status(400).json({ error: 'Key ID is required' });
      return;
    }

    await revokeApiKeyService(req.user!.userId, keyId);
    res.json({ message: 'API key revoked successfully' });
  } catch (err) {
    console.error('[revokeApiKey]', err);
    res.status(getErrorStatus(err)).json({
      error: getErrorMessage(err, 'Failed to revoke API key'),
    });
  }
};
