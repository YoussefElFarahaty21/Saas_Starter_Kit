import { useState } from 'react';
import { apiFetch } from '../utils/api.js';
import './OnboardingStep2.css';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with the basics',
    features: ['Dashboard access', 'JWT auth', 'Up to 3 projects'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    description: 'For growing teams',
    features: ['Everything in Free', 'Google OAuth', 'API access', 'Priority support'],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    description: 'For large organizations',
    features: ['Everything in Pro', 'Admin panel', 'Mobile app', 'Dedicated support'],
  },
];

export function OnboardingStep2({ selectedPlan, onPlanSelect, onContinue }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const handlePlanClick = async (planId) => {
    setError('');
    onPlanSelect(planId);

    if (planId === 'free') {
      onContinue(planId);
      return;
    }

    setLoading(planId);
    try {
      const origin = window.location.origin;
      const res = await apiFetch('/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          successUrl: `${origin}/onboarding?step=3&success=true`,
          cancelUrl: `${origin}/onboarding?step=2&cancelled=true`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('No checkout URL returned');
    } catch (err) {
      setError(err.message);
      setLoading(null);
    }
  };

  return (
    <div className="onboarding-step">
      <h2 className="onboarding-step__title">Pick your plan</h2>
      <p className="onboarding-step__subtitle">
        Start free or upgrade now. You can change plans anytime from billing.
      </p>

      {error && <div className="onboarding-step__error">{error}</div>}

      <div className="onboarding-plans">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className={`onboarding-plan-card${plan.highlight ? ' onboarding-plan-card--highlight' : ''}${selectedPlan === plan.id ? ' onboarding-plan-card--selected' : ''}`}
            onClick={() => handlePlanClick(plan.id)}
            disabled={loading !== null}
          >
            {plan.highlight && <span className="onboarding-plan-card__badge">Most Popular</span>}
            <h3 className="onboarding-plan-card__name">{plan.name}</h3>
            <p className="onboarding-plan-card__description">{plan.description}</p>
            <div className="onboarding-plan-card__price">
              <span className="onboarding-plan-card__amount">${plan.price}</span>
              {plan.price > 0 && <span className="onboarding-plan-card__period">/mo</span>}
            </div>
            <ul className="onboarding-plan-card__features">
              {plan.features.map((feature) => (
                <li key={feature}>
                  <span aria-hidden="true">✓</span> {feature}
                </li>
              ))}
            </ul>
            <span className="onboarding-plan-card__cta">
              {loading === plan.id ? 'Redirecting…' : plan.id === 'free' ? 'Continue with Free' : `Choose ${plan.name}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
