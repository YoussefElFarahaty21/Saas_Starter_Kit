import { Request, Response } from 'express';
import { getAllUsers, updateUser, getUserById } from '../../services/services/userService';
import { Plan } from '../../services/services/planService';

export const listUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await getAllUsers();
    const safeUsers = users.map(({ passwordHash, refreshToken, ...u }) => {
      void passwordHash;
      void refreshToken;
      return u;
    });
    res.json({ users: safeUsers, total: safeUsers.length });
  } catch (err) {
    console.error('[listUsers]', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const changeUserPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { plan } = req.body as { plan: Plan };

    const validPlans: Plan[] = ['free', 'pro', 'enterprise'];
    if (!validPlans.includes(plan)) {
      res.status(400).json({ error: 'Invalid plan. Must be free, pro, or enterprise' });
      return;
    }

    const user = await getUserById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await updateUser(id, { plan });
    res.json({ message: `User plan updated to ${plan}`, userId: id, plan });
  } catch (err) {
    console.error('[changeUserPlan]', err);
    res.status(500).json({ error: 'Failed to update user plan' });
  }
};

export const suspendUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { suspend } = req.body as { suspend: boolean };

    // Prevent self-suspension
    if (id === req.user!.userId) {
      res.status(400).json({ error: 'Cannot suspend your own account' });
      return;
    }

    const user = await getUserById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const status = suspend ? 'suspended' : 'active';
    await updateUser(id, { status });

    res.json({
      message: `User ${status === 'suspended' ? 'suspended' : 'reactivated'} successfully`,
      userId: id,
      status,
    });
  } catch (err) {
    console.error('[suspendUser]', err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};
