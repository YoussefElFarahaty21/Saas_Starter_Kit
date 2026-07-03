import { FieldValue } from 'firebase-admin/firestore';
import db from '../../config/firebaseAdmin';

const INTEGRATIONS = 'integrations';

const postToSlackUrl = async (url: string, message: string): Promise<void> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook failed with status ${res.status}`);
  }
};

/**
 * Posts a message to the platform Slack channel (SLACK_WEBHOOK_URL).
 */
export const sendSlackNotification = async (message: string): Promise<void> => {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.warn('[Slack] SLACK_WEBHOOK_URL is not configured');
    return;
  }

  await postToSlackUrl(url, message);
};

export const notifyNewSignup = async (email: string): Promise<void> => {
  await sendSlackNotification(`🎉 New signup: ${email}`);
};

export const notifyPlanUpgrade = async (email: string, plan: string): Promise<void> => {
  await sendSlackNotification(`⬆️ Plan upgrade: ${email} → *${plan}*`);
};

export const getUserSlackWebhook = async (
  userId: string,
): Promise<{ url: string | null }> => {
  const doc = await db.collection(INTEGRATIONS).doc(userId).get();
  if (!doc.exists) return { url: null };
  const data = doc.data() as { slackWebhookUrl?: string };
  return { url: data.slackWebhookUrl || null };
};

export const saveUserSlackWebhook = async (
  userId: string,
  url: string,
): Promise<{ url: string }> => {
  const trimmed = url.trim();
  await db.collection(INTEGRATIONS).doc(userId).set(
    {
      userId,
      slackWebhookUrl: trimmed,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return { url: trimmed };
};

export const testUserSlackWebhook = async (userId: string): Promise<void> => {
  const { url } = await getUserSlackWebhook(userId);
  if (!url) {
    throw Object.assign(new Error('No Slack webhook URL saved'), { statusCode: 400 });
  }

  await postToSlackUrl(url, '✅ SaaS Starter Kit test notification — your Slack webhook is working.');
};

export const notifyUserSlack = async (userId: string, message: string): Promise<void> => {
  const { url } = await getUserSlackWebhook(userId);
  if (!url) return;
  await postToSlackUrl(url, message);
};
