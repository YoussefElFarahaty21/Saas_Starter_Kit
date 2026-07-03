import { createHmac, randomBytes } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import db from '../../config/firebaseAdmin';

export const WEBHOOK_EVENTS = [
  'user.created',
  'plan.upgraded',
  'plan.cancelled',
  'member.invited',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface OutgoingWebhook {
  id: string;
  userId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  status: 'active' | 'paused';
  createdAt: FirebaseFirestore.Timestamp;
}

const COLLECTION = 'webhooks';

const isValidEvent = (event: string): event is WebhookEvent =>
  (WEBHOOK_EVENTS as readonly string[]).includes(event);

export const createWebhook = async (
  userId: string,
  url: string,
  events: string[],
): Promise<OutgoingWebhook> => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    throw Object.assign(new Error('Webhook URL must start with http:// or https://'), {
      statusCode: 400,
    });
  }

  const selectedEvents = [...new Set(events)].filter(isValidEvent);
  if (selectedEvents.length === 0) {
    throw Object.assign(new Error('Select at least one event'), { statusCode: 400 });
  }

  const secret = randomBytes(32).toString('hex');
  const ref = db.collection(COLLECTION).doc();
  const webhook = {
    id: ref.id,
    userId,
    url: trimmedUrl,
    events: selectedEvents,
    secret,
    status: 'active' as const,
    createdAt: FieldValue.serverTimestamp(),
  };

  await ref.set(webhook);

  return {
    ...webhook,
    createdAt: null as unknown as FirebaseFirestore.Timestamp,
  };
};

export const listWebhooks = async (userId: string): Promise<OutgoingWebhook[]> => {
  const snap = await db.collection(COLLECTION).where('userId', '==', userId).get();

  const webhooks = snap.docs.map((doc) => {
    const data = doc.data() as Omit<OutgoingWebhook, 'id'>;
    return { id: doc.id, ...data };
  });

  webhooks.sort((a, b) => {
    const aTime = a.createdAt && 'seconds' in a.createdAt ? a.createdAt.seconds : 0;
    const bTime = b.createdAt && 'seconds' in b.createdAt ? b.createdAt.seconds : 0;
    return bTime - aTime;
  });

  return webhooks;
};

export const deleteWebhook = async (userId: string, webhookId: string): Promise<void> => {
  const doc = await db.collection(COLLECTION).doc(webhookId).get();
  if (!doc.exists) {
    throw Object.assign(new Error('Webhook not found'), { statusCode: 404 });
  }

  const data = doc.data() as OutgoingWebhook;
  if (data.userId !== userId) {
    throw Object.assign(new Error('Webhook not found'), { statusCode: 404 });
  }

  await doc.ref.delete();
};

export const toggleWebhook = async (
  userId: string,
  webhookId: string,
): Promise<OutgoingWebhook> => {
  const doc = await db.collection(COLLECTION).doc(webhookId).get();
  if (!doc.exists) {
    throw Object.assign(new Error('Webhook not found'), { statusCode: 404 });
  }

  const data = { id: doc.id, ...doc.data() } as OutgoingWebhook;
  if (data.userId !== userId) {
    throw Object.assign(new Error('Webhook not found'), { statusCode: 404 });
  }

  const status = data.status === 'active' ? 'paused' : 'active';
  await doc.ref.update({ status });

  return { ...data, status };
};

/**
 * Finds active webhooks for the user that subscribe to the event,
 * signs the payload with HMAC-SHA256, and POSTs to each URL.
 */
export const dispatchWebhook = async (
  userId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<void> => {
  const snap = await db
    .collection(COLLECTION)
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .get();

  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  const deliveries = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as OutgoingWebhook)
    .filter((webhook) => webhook.events.includes(event))
    .map(async (webhook) => {
      const signature = createHmac('sha256', webhook.secret).update(body).digest('hex');

      try {
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
          },
          body,
        });

        if (!res.ok) {
          console.error(
            `[Webhook] Delivery failed for ${webhook.id} (${event}): status ${res.status}`,
          );
        }
      } catch (err) {
        console.error(`[Webhook] Delivery error for ${webhook.id} (${event}):`, err);
      }
    });

  await Promise.all(deliveries);
};
