import { FieldValue } from 'firebase-admin/firestore';
import db from '../../config/firebaseAdmin';

export interface UsageRecord {
  id: string;
  userId: string;
  date: string;
  count: number;
  updatedAt: FirebaseFirestore.Timestamp;
}

/** Daily API call limits by plan. `-1` means unlimited. */
export const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  pro: 1000,
  enterprise: -1,
};

const COLLECTION = 'usage';

const todayKey = (): string => new Date().toISOString().slice(0, 10);

const usageDocId = (userId: string, date: string): string => `${userId}_${date}`;

export const getPlanLimit = (plan: string): number => {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
};

/**
 * Returns today's usage count for the user (0 if no record yet).
 */
export const getUsage = async (userId: string): Promise<number> => {
  const date = todayKey();
  const doc = await db.collection(COLLECTION).doc(usageDocId(userId, date)).get();
  if (!doc.exists) return 0;
  const data = doc.data() as UsageRecord;
  return data.count ?? 0;
};

/**
 * Increments today's usage count in Firestore and returns the new count.
 */
export const incrementUsage = async (userId: string): Promise<number> => {
  const date = todayKey();
  const ref = db.collection(COLLECTION).doc(usageDocId(userId, date));

  const newCount = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? ((snap.data() as UsageRecord).count ?? 0) : 0;
    const count = current + 1;

    if (snap.exists) {
      tx.update(ref, {
        count,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      tx.set(ref, {
        id: ref.id,
        userId,
        date,
        count,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return count;
  });

  return newCount;
};

/**
 * Checks whether the user is within their plan's daily limit.
 */
export const checkUsageLimit = async (
  userId: string,
  plan: string,
): Promise<{ allowed: boolean; count: number; limit: number }> => {
  const count = await getUsage(userId);
  const limit = getPlanLimit(plan);
  const allowed = limit === -1 || count < limit;
  return { allowed, count, limit };
};
