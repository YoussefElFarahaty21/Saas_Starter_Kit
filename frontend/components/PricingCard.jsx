import { apiFetch } from '../utils/api.js';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with the basics',
    features: [
      'Basic dashboard access',
      'Up to 3 projects',
      'Community support',
    ],
    cta: 'Get Started',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    description: 'Perfect for growing teams',
    features: [
      'Everything in Free',
      'Unlimited projects',
      'API access',
      'Priority support badge',
      'Advanced analytics',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Admin panel access',
      'White-label option',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Upgrade to Enterprise',
    highlight: false,
  },
];

export function PricingCard({ currentPlan, onUpgrade }) {
  const handleSubscribe = async (planId) => {
    if (planId === 'free') return;
    if (onUpgrade) {
      onUpgrade(planId);
      return;
    }
    try {
      const res = await apiFetch('/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Subscription error:', err);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
      {PLANS.map((plan) => {
        const isCurrent = currentPlan === plan.id;
        return (
          <div
            key={plan.id}
            style={{
              border: plan.highlight ? '2px solid #6366f1' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '32px 28px',
              width: '280px',
              background: 'var(--card-bg)',
              boxShadow: plan.highlight
                ? '0 4px 24px rgba(99,102,241,0.15)'
                : '0 1px 3px rgba(0,0,0,.08)',
              position: 'relative',
            }}
          >
            {plan.highlight && (
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--accent)',
                  color: 'var(--text-inverse)',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 16px',
                  borderRadius: '999px',
                  letterSpacing: '0.05em',
                }}
              >
                MOST POPULAR
              </div>
            )}
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{plan.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>{plan.description}</p>
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '36px', fontWeight: 800 }}>${plan.price}</span>
              {plan.price > 0 && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>/month</span>
              )}
            </div>
            <ul style={{ listStyle: 'none', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plan.features.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-primary)' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={isCurrent}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: isCurrent ? 'var(--border)' : plan.highlight ? 'var(--accent)' : 'var(--text-primary)',
                color: isCurrent ? 'var(--text-secondary)' : 'var(--card-bg)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: isCurrent ? 'default' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {isCurrent ? 'Current Plan' : plan.cta}
            </button>
          </div>
        );
      })}
    </div>
  );
}
