import { Request, Response } from 'express';
import Stripe from 'stripe';
import {
  constructWebhookEvent,
  confirmPlanUpgrade,
  confirmPlanCancellation,
  saveInvoiceToFirestore,
  getUserByStripeCustomerId,
  stripe,
} from '../../services/services/billingService';
import { sendInvoiceEmail } from '../../services/services/emailService';

const getPlanFromPriceId = (priceId: string): 'free' | 'pro' | 'enterprise' => {
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return 'enterprise';
  return 'free';
};

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(400).json({ error: 'Missing Stripe signature' });
    return;
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(req.body as Buffer, signature);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['items.data.price'],
          });
          const priceId = (sub.items.data[0]?.price as Stripe.Price)?.id;
          const plan = getPlanFromPriceId(priceId || '');

          await confirmPlanUpgrade(userId, plan, subscriptionId);
          console.log(`[Webhook] checkout.session.completed — user ${userId} upgraded to ${plan}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const user = await getUserByStripeCustomerId(customerId);

        if (user && invoice.id) {
          await saveInvoiceToFirestore(
            user.id,
            invoice.id,
            invoice.amount_paid,
            'paid',
          );

          if (invoice.hosted_invoice_url) {
            await sendInvoiceEmail(
              user.email,
              user.name,
              invoice.amount_paid,
              invoice.hosted_invoice_url,
            ).catch(() => console.error('[Email] Failed to send invoice email'));
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const user = await getUserByStripeCustomerId(customerId);

        if (user && invoice.id) {
          await saveInvoiceToFirestore(user.id, invoice.id, invoice.amount_due, 'failed');
          console.warn(`[Webhook] Payment failed for user ${user.id}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const user = await getUserByStripeCustomerId(customerId);

        if (user) {
          await confirmPlanCancellation(user.id);
          console.log(`[Webhook] Subscription cancelled — user ${user.id} downgraded to free`);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Webhook] Handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};
