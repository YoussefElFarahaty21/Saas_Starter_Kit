import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { notifyNewSignup, notifyUserSlack } from '../services/slackService';
import { dispatchWebhook } from '../services/webhookService';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  plan: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;
};

export const verifyGoogleToken = async (
  idToken: string,
): Promise<{ email: string; name: string; googleId: string }> => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Invalid Google token');
  }

  return {
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    googleId: payload.sub,
  };
};

/**
 * Side effects after a new user account is created (Slack + outgoing webhooks).
 */
export const onUserRegistered = async (userId: string, email: string): Promise<void> => {
  await notifyNewSignup(email).catch((err) => {
    console.error('[Slack] Failed to notify new signup', err);
  });

  await notifyUserSlack(userId, `🎉 Welcome! Your account (${email}) is ready.`).catch((err) => {
    console.error('[Slack] Failed to notify user Slack', err);
  });

  await dispatchWebhook(userId, 'user.created', { userId, email }).catch((err) => {
    console.error('[Webhook] Failed to dispatch user.created', err);
  });
};
