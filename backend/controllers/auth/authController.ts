import { Request, Response } from 'express';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyGoogleToken,
  onUserRegistered,
} from '../../services/auth/authService';
import {
  createUser,
  getUserByEmail,
  getUserById,
  saveRefreshToken,
  clearRefreshToken,
} from '../../services/services/userService';
import { sendWelcomeEmail } from '../../services/services/emailService';
import type { User } from '../../services/services/userService';

const toAuthUser = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  plan: user.plan,
  role: user.role,
  onboardingComplete: user.onboardingComplete === false ? false : true,
  preferences: user.preferences ?? { theme: 'light' as const },
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      passwordHash,
      name,
      role: 'user',
      plan: 'free',
      onboardingComplete: false,
      preferences: { theme: 'light' },
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      status: 'active',
      refreshToken: null,
    });

    const payload = { userId: user.id, email: user.email, role: user.role, plan: user.plan };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await saveRefreshToken(user.id, refreshToken);

    await sendWelcomeEmail(user.email, user.name).catch(() => {
      // Non-fatal — log but don't block registration
      console.error('[Email] Failed to send welcome email');
    });

    await onUserRegistered(user.id, user.email);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: toAuthUser(user),
    });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'Account suspended' });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const payload = { userId: user.id, email: user.email, role: user.role, plan: user.plan };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await saveRefreshToken(user.id, refreshToken);

    res.json({
      accessToken,
      refreshToken,
      user: toAuthUser(user),
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ error: 'Google ID token required' });
      return;
    }

    const { email, name } = await verifyGoogleToken(idToken);

    let user = await getUserByEmail(email);

    if (!user) {
      // Auto-register Google users
      user = await createUser({
        email,
        passwordHash: '',
        name,
        role: 'user',
        plan: 'free',
        onboardingComplete: false,
        preferences: { theme: 'light' },
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        status: 'active',
        refreshToken: null,
      });
      await sendWelcomeEmail(email, name).catch(() => {
        console.error('[Email] Failed to send welcome email');
      });
      await onUserRegistered(user.id, user.email);
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'Account suspended' });
      return;
    }

    const payload = { userId: user.id, email: user.email, role: user.role, plan: user.plan };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await saveRefreshToken(user.id, refreshToken);

    res.json({
      accessToken,
      refreshToken,
      user: toAuthUser(user),
    });
  } catch (err) {
    console.error('[googleAuth]', err);
    res.status(401).json({ error: 'Google authentication failed' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const decoded = verifyRefreshToken(token);
    const user = await getUserById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'Account suspended' });
      return;
    }

    const payload = { userId: user.id, email: user.email, role: user.role, plan: user.plan };
    const newAccessToken = generateAccessToken(payload);

    res.json({
      accessToken: newAccessToken,
      user: toAuthUser(user),
    });
  } catch (err) {
    console.error('[refreshToken]', err);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await clearRefreshToken(req.user.userId);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('[logout]', err);
    res.status(500).json({ error: 'Logout failed' });
  }
};
