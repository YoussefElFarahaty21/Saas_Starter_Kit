export type Plan = 'free' | 'pro' | 'enterprise';

const PLAN_LEVELS: Record<Plan, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

export const getPlanLevel = (plan: string): number => {
  return PLAN_LEVELS[(plan as Plan)] ?? 0;
};

export const hasFeatureAccess = (userPlan: string, requiredPlan: Plan): boolean => {
  return getPlanLevel(userPlan) >= getPlanLevel(requiredPlan);
};

export const PLAN_FEATURES: Record<Plan, string[]> = {
  free: [
    'Basic dashboard access',
    'Up to 3 projects',
    'Community support',
  ],
  pro: [
    'Everything in Free',
    'Unlimited projects',
    'API access',
    'Priority support badge',
    'Advanced analytics',
  ],
  enterprise: [
    'Everything in Pro',
    'Admin panel access',
    'White-label option',
    'Dedicated support',
    'Custom integrations',
    'SLA guarantee',
  ],
};

export const PLAN_PRICES: Record<Plan, { monthly: number; priceId: string | undefined }> = {
  free: { monthly: 0, priceId: undefined },
  pro: { monthly: 19, priceId: process.env.STRIPE_PRICE_PRO },
  enterprise: { monthly: 99, priceId: process.env.STRIPE_PRICE_ENTERPRISE },
};
