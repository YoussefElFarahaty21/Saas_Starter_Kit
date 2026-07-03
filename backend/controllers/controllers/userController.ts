import { Request, Response } from 'express';
import {
  getUserById,
  updateUser,
  deleteUser,
  setOnboardingComplete,
  updatePreferences as updatePreferencesService,
} from '../../services/services/userService';
import type { User } from '../../services/services/userService';
import { hashPassword, comparePassword } from '../../services/auth/authService';

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { passwordHash, refreshToken, ...safeUser } = user;
    void passwordHash;
    void refreshToken;
    res.json({ user: safeUser });
  } catch (err) {
    console.error('[getProfile]', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body;
    const updates: Record<string, unknown> = {};

    if (name) updates.name = name;
    if (email) updates.email = email;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    await updateUser(req.user!.userId, updates);
    const updated = await getUserById(req.user!.userId);
    const { passwordHash, refreshToken, ...safeUser } = updated!;
    void passwordHash;
    void refreshToken;

    res.json({ user: safeUser });
  } catch (err) {
    console.error('[updateProfile]', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password required' });
      return;
    }

    const user = await getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.passwordHash) {
      res.status(400).json({ error: 'Password change not available for OAuth accounts' });
      return;
    }

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await updateUser(req.user!.userId, { passwordHash: newHash });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('[changePassword]', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

export const completeOnboarding = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, plan } = req.body as { name?: string; plan?: User['plan'] };

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const validPlans: User['plan'][] = ['free', 'pro', 'enterprise'];
    const selectedPlan = plan ?? 'free';
    if (!validPlans.includes(selectedPlan)) {
      res.status(400).json({ error: 'Invalid plan' });
      return;
    }

    const user = await setOnboardingComplete(req.user!.userId, {
      name: name.trim(),
      plan: selectedPlan,
    });

    const { passwordHash, refreshToken, ...safeUser } = user;
    void passwordHash;
    void refreshToken;

    res.json({ user: safeUser });
  } catch (err) {
    console.error('[completeOnboarding]', err);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
};

export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const { theme } = req.body as { theme?: 'light' | 'dark' };

    if (!theme || (theme !== 'light' && theme !== 'dark')) {
      res.status(400).json({ error: 'theme must be "light" or "dark"' });
      return;
    }

    const user = await updatePreferencesService(req.user!.userId, { theme });
    const { passwordHash, refreshToken, ...safeUser } = user;
    void passwordHash;
    void refreshToken;

    res.json({ user: safeUser, preferences: safeUser.preferences });
  } catch (err) {
    console.error('[updatePreferences]', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    await deleteUser(req.user!.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('[deleteAccount]', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};
