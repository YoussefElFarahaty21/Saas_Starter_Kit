import Stripe from 'stripe';
import { FieldValue } from 'firebase-admin/firestore';
import db from '../../config/firebaseAdmin';
import { getUserById, updateUser } from './userService';
import { notifyPlanUpgrade, notifyUserSlack } from './slackService';
import { dispatchWebhook } from './webhookService';
import type { Plan } from './planService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

const INVOICES_COLLECTION = 'invoices';

export const getOrCreateStripeCustomer = async (
  userId: string,
  email: string,
  name: string,
  existingCustomerId: string | null,
): Promise<string> => {
  if (existingCustomerId) return existingCustomerId;

  const customer = await stripe.customers.create({ email, name, metadata: { userId } });
  await db.collection('users').doc(userId).update({ stripeCustomerId: customer.id });
  return customer.id;
};

export const createCheckoutSession = async (
  customerId: string,
  priceId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> => {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
  });

  return session.url as string;
};

export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  await stripe.subscriptions.cancel(subscriptionId);
};

export const cancelSubscriptionAtPeriodEnd = async (
  subscriptionId: string,
): Promise<Stripe.Subscription> => {
  return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
};

export const getSubscription = async (
  subscriptionId: string,
): Promise<Stripe.Subscription> => {
  return stripe.subscriptions.retrieve(subscriptionId);
};

export const listStripeInvoices = async (customerId: string): Promise<Stripe.Invoice[]> => {
  const result = await stripe.invoices.list({ customer: customerId, limit: 20 });
  return result.data;
};

export const saveInvoiceToFirestore = async (
  userId: string,
  stripeInvoiceId: string,
  amount: number,
  status: string,
): Promise<void> => {
  await db.collection(INVOICES_COLLECTION).add({
    userId,
    stripeInvoiceId,
    amount,
    status,
    createdAt: FieldValue.serverTimestamp(),
  });
};

export const getUserInvoicesFromFirestore = async (userId: string) => {
  const snap = await db
    .collection(INVOICES_COLLECTION)
    .where('userId', '==', userId)
    .get();

  const invoices = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return invoices.sort((a, b) => {
    const aTime = (a as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0;
    const bTime = (b as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
};

export const getUserByStripeCustomerId = async (
  customerId: string,
): Promise<{ id: string; email: string; name: string; plan: string } | null> => {
  const snap = await db
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as {
    id: string;
    email: string;
    name: string;
    plan: string;
  };
};

export const constructWebhookEvent = (
  rawBody: Buffer,
  signature: string,
): Stripe.Event => {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET as string,
  );
};

/**
 * Confirms a paid plan upgrade and fires Slack + outgoing webhook notifications.
 */
export const confirmPlanUpgrade = async (
  userId: string,
  plan: Plan,
  subscriptionId: string,
): Promise<void> => {
  await updateUser(userId, { plan, stripeSubscriptionId: subscriptionId });

  const user = await getUserById(userId);
  if (!user) return;

  await notifyPlanUpgrade(user.email, plan).catch((err) => {
    console.error('[Slack] Failed to notify plan upgrade', err);
  });

  await notifyUserSlack(
    userId,
    `⬆️ Your plan was upgraded to *${plan}*.`,
  ).catch((err) => {
    console.error('[Slack] Failed to notify user Slack', err);
  });

  await dispatchWebhook(userId, 'plan.upgraded', {
    email: user.email,
    plan,
    userId,
  }).catch((err) => {
    console.error('[Webhook] Failed to dispatch plan.upgraded', err);
  });
};

/**
 * Confirms subscription cancellation and fires outgoing webhook notifications.
 */
export const confirmPlanCancellation = async (userId: string): Promise<void> => {
  await updateUser(userId, { plan: 'free', stripeSubscriptionId: null });

  const user = await getUserById(userId);
  if (!user) return;

  await notifyUserSlack(
    userId,
    '⚠️ Your subscription was cancelled. You are now on the Free plan.',
  ).catch((err) => {
    console.error('[Slack] Failed to notify user Slack', err);
  });

  await dispatchWebhook(userId, 'plan.cancelled', {
    email: user.email,
    plan: 'free',
    userId,
  }).catch((err) => {
    console.error('[Webhook] Failed to dispatch plan.cancelled', err);
  });
};

export { stripe };
