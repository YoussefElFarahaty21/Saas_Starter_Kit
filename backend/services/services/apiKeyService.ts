import { randomBytes, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { FieldValue } from 'firebase-admin/firestore';
import db from '../../config/firebaseAdmin';
import { getUserById, User } from './userService';

export interface ApiKeyRecord {
  id: string;
  userId: string;
  key: string;
  prefix: string;
  label: string;
  createdAt: FirebaseFirestore.Timestamp;
  lastUsedAt: FirebaseFirestore.Timestamp | null;
  status: 'active' | 'revoked';
}

export interface ApiKeyPublic {
  id: string;
  key: string;
  prefix: string;
  label: string;
  status: 'active' | 'revoked';
  createdAt: FirebaseFirestore.Timestamp | null;
  lastUsedAt: FirebaseFirestore.Timestamp | null;
}

const COLLECTION = 'apiKeys';

const isBcryptHash = (value: string): boolean => value.startsWith('$2');

const keysMatch = async (rawKey: string, storedKey: string): Promise<boolean> => {
  // Legacy keys were stored as bcrypt hashes
  if (isBcryptHash(storedKey)) {
    return bcrypt.compare(rawKey, storedKey);
  }

  const a = Buffer.from(rawKey);
  const b = Buffer.from(storedKey);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

const toPublic = (record: ApiKeyRecord): ApiKeyPublic => ({
  id: record.id,
  key: isBcryptHash(record.key) ? '' : record.key,
  prefix: record.prefix,
  label: record.label,
  status: record.status,
  createdAt: record.createdAt ?? null,
  lastUsedAt: record.lastUsedAt ?? null,
});

/**
 * Generates a secure API key, stores it for later retrieval, and returns the key.
 */
export const generateApiKey = async (
  userId: string,
  label: string,
): Promise<ApiKeyPublic> => {
  const rawKey = randomBytes(32).toString('hex');
  const prefix = rawKey.slice(0, 8);

  const ref = db.collection(COLLECTION).doc();
  const record = {
    id: ref.id,
    userId,
    key: rawKey,
    prefix,
    label: label.trim(),
    status: 'active' as const,
    createdAt: FieldValue.serverTimestamp(),
    lastUsedAt: null,
  };

  await ref.set(record);

  return {
    id: record.id,
    key: record.key,
    prefix: record.prefix,
    label: record.label,
    status: record.status,
    createdAt: null,
    lastUsedAt: null,
  };
};

/**
 * Lists all API keys for a user, including the full key for copying.
 */
export const listApiKeys = async (userId: string): Promise<ApiKeyPublic[]> => {
  const snap = await db
    .collection(COLLECTION)
    .where('userId', '==', userId)
    .get();

  const keys = snap.docs.map((doc) => {
    const data = { id: doc.id, ...doc.data() } as ApiKeyRecord;
    return toPublic(data);
  });

  keys.sort((a, b) => {
    const aTime = a.createdAt && 'seconds' in a.createdAt ? a.createdAt.seconds : 0;
    const bTime = b.createdAt && 'seconds' in b.createdAt ? b.createdAt.seconds : 0;
    return bTime - aTime;
  });

  return keys;
};

/**
 * Revokes an API key owned by the user.
 */
export const revokeApiKey = async (userId: string, keyId: string): Promise<void> => {
  const doc = await db.collection(COLLECTION).doc(keyId).get();
  if (!doc.exists) {
    throw Object.assign(new Error('API key not found'), { statusCode: 404 });
  }

  const record = doc.data() as ApiKeyRecord;
  if (record.userId !== userId) {
    throw Object.assign(new Error('API key not found'), { statusCode: 404 });
  }

  if (record.status === 'revoked') {
    throw Object.assign(new Error('API key is already revoked'), { statusCode: 400 });
  }

  await doc.ref.update({ status: 'revoked' });
};

/**
 * Validates a raw API key and returns the owning user if active.
 */
export const validateApiKey = async (rawKey: string): Promise<User | null> => {
  if (!rawKey || rawKey.length < 8) return null;

  const prefix = rawKey.slice(0, 8);
  const snap = await db
    .collection(COLLECTION)
    .where('prefix', '==', prefix)
    .where('status', '==', 'active')
    .get();

  for (const doc of snap.docs) {
    const record = { id: doc.id, ...doc.data() } as ApiKeyRecord;
    const match = await keysMatch(rawKey, record.key);
    if (!match) continue;

    const user = await getUserById(record.userId);
    if (!user || user.status === 'suspended') return null;

    await doc.ref.update({ lastUsedAt: FieldValue.serverTimestamp() });
    return user;
  }

  return null;
};
