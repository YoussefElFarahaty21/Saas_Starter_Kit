import { Request, Response } from 'express';
import {
  getOrCreateStripeCustomer,
  createCheckoutSession,
  cancelSubscriptionAtPeriodEnd,
  getSubscription,
  listStripeInvoices,
  getUserInvoicesFromFirestore,
} from '../../services/services/billingService';
import { getUserById } from '../../services/services/userService';
import { sendCancellationEmail } from '../../services/services/emailService';
import { PLAN_PRICES, Plan } from '../../services/services/planService';

export const createSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan, successUrl, cancelUrl } = req.body as {
      plan: Plan;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!plan || plan === 'free') {
      res.status(400).json({ error: 'Valid paid plan required (pro or enterprise)' });
      return;
    }

    const priceId = PLAN_PRICES[plan]?.priceId;
    if (!priceId) {
      res.status(400).json({ error: 'Plan price not configured' });
      return;
    }

    const user = await getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email,
      user.name,
      user.stripeCustomerId,
    );

    const success = successUrl || `${process.env.CLIENT_URL}/billing?success=true`;
    const cancel = cancelUrl || `${process.env.CLIENT_URL}/billing?cancelled=true`;

    const checkoutUrl = await createCheckoutSession(
      customerId,
      priceId,
      user.id,
      success,
      cancel,
    );

    res.json({ url: checkoutUrl });
  } catch (err) {
    console.error('[createSubscription]', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

export const cancelUserSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.stripeSubscriptionId) {
      res.status(400).json({ error: 'No active subscription found' });
      return;
    }

    await cancelSubscriptionAtPeriodEnd(user.stripeSubscriptionId);

    await sendCancellationEmail(user.email, user.name).catch(() => {
      console.error('[Email] Failed to send cancellation email');
    });

    res.json({
      message: 'Subscription will cancel at the end of the current billing period',
      cancelAtPeriodEnd: true,
    });
  } catch (err) {
    console.error('[cancelUserSubscription]', err);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

export const getPlanStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let subscriptionDetails = null;
    if (user.stripeSubscriptionId) {
      try {
        const sub = await getSubscription(user.stripeSubscriptionId);
        subscriptionDetails = {
          status: sub.status,
          currentPeriodEnd: (sub as unknown as { current_period_end: number }).current_period_end,
          cancelAtPeriodEnd: (sub as unknown as { cancel_at_period_end: boolean }).cancel_at_period_end,
        };
      } catch {
        // Subscription may no longer exist
      }
    }

    res.json({
      plan: user.plan,
      status: user.status,
      subscription: subscriptionDetails,
    });
  } catch (err) {
    console.error('[getPlanStatus]', err);
    res.status(500).json({ error: 'Failed to fetch plan status' });
  }
};

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let stripeInvoices: unknown[] = [];
    if (user.stripeCustomerId) {
      stripeInvoices = await listStripeInvoices(user.stripeCustomerId);
    }

    const firestoreInvoices = await getUserInvoicesFromFirestore(user.id);

    res.json({ invoices: stripeInvoices, history: firestoreInvoices });
  } catch (err) {
    console.error('[getInvoices]', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};
