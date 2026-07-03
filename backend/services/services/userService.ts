import { FieldValue } from 'firebase-admin/firestore';
import db from '../../config/firebaseAdmin';

export interface UserPreferences {
  theme: 'light' | 'dark';
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'enterprise';
  onboardingComplete: boolean;
  preferences: UserPreferences;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: 'active' | 'suspended';
  refreshToken: string | null;
  createdAt: FirebaseFirestore.Timestamp;
}

const COLLECTION = 'users';

export const createUser = async (
  data: Omit<User, 'id' | 'createdAt'>,
): Promise<User> => {
  const ref = db.collection(COLLECTION).doc();
  const user = {
    ...data,
    id: ref.id,
    createdAt: FieldValue.serverTimestamp(),
  };
  await ref.set(user);
  return { ...user, createdAt: null as unknown as FirebaseFirestore.Timestamp };
};

export const getUserById = async (id: string): Promise<User | null> => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as User;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const snap = await db
    .collection(COLLECTION)
    .where('email', '==', email)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as User;
};

export const updateUser = async (
  id: string,
  data: Partial<Omit<User, 'id' | 'createdAt'>>,
): Promise<void> => {
  await db.collection(COLLECTION).doc(id).update(data as FirebaseFirestore.UpdateData<User>);
};

export const deleteUser = async (id: string): Promise<void> => {
  await db.collection(COLLECTION).doc(id).delete();
};

export const getAllUsers = async (): Promise<User[]> => {
  const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
};

export const saveRefreshToken = async (userId: string, token: string): Promise<void> => {
  await db.collection(COLLECTION).doc(userId).update({ refreshToken: token });
};

export const clearRefreshToken = async (userId: string): Promise<void> => {
  await db.collection(COLLECTION).doc(userId).update({ refreshToken: null });
};

export const setOnboardingComplete = async (
  userId: string,
  data: { name: string; plan: User['plan'] },
): Promise<User> => {
  await updateUser(userId, {
    name: data.name,
    plan: data.plan,
    onboardingComplete: true,
  });

  const updated = await getUserById(userId);
  if (!updated) {
    throw new Error('User not found');
  }

  return updated;
};

export const updatePreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>,
): Promise<User> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const nextPreferences: UserPreferences = {
    theme: preferences.theme ?? user.preferences?.theme ?? 'light',
  };

  await updateUser(userId, { preferences: nextPreferences });

  const updated = await getUserById(userId);
  if (!updated) {
    throw new Error('User not found');
  }

  return updated;
};
