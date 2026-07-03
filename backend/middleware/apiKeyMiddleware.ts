import { Request, Response, NextFunction } from 'express';
import { validateApiKey } from '../services/services/apiKeyService';

/**
 * Authenticates requests using an API key.
 *
 * Expects: Authorization: ApiKey <raw-key>
 *
 * On success, attaches the owning user to req.user (same shape as JWT auth).
 */
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('ApiKey ')) {
      res.status(401).json({ error: 'API key required' });
      return;
    }

    const rawKey = authHeader.slice('ApiKey '.length).trim();
    if (!rawKey) {
      res.status(401).json({ error: 'Invalid or revoked API key' });
      return;
    }

    const user = await validateApiKey(rawKey);
    if (!user) {
      res.status(401).json({ error: 'Invalid or revoked API key' });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    next();
  } catch (err) {
    console.error('[authenticateApiKey]', err);
    res.status(500).json({ error: 'Failed to authenticate API key' });
  }
};
