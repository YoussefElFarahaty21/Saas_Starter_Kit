/**
 * Creates the initial admin user in Firestore.
 * Run: npm run seed:admin
 *
 * Required env vars (set in backend/.env):
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 *   Plus all Firebase Admin credentials.
 */
import 'dotenv/config';
import { hashPassword } from '../services/auth/authService';
import { createUser, getUserByEmail } from '../services/services/userService';

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters');
    process.exit(1);
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    console.log(`Admin user already exists: ${email} (id: ${existing.id})`);
    console.log('To promote manually, set role=admin and plan=enterprise in Firestore.');
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    email,
    passwordHash,
    name,
    role: 'admin',
    plan: 'enterprise',
    onboardingComplete: true,
    preferences: { theme: 'light' },
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    status: 'active',
    refreshToken: null,
  });

  console.log('Admin user created successfully:');
  console.log(`  Email: ${email}`);
  console.log(`  ID:    ${user.id}`);
  console.log(`  Role:  admin | Plan: enterprise`);
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
