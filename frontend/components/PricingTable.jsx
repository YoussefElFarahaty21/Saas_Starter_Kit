import { CTAButton } from './CTAButton.jsx';
import './PricingTable.css';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with the basics',
    features: [
      'Basic dashboard access',
      'JWT authentication',
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
      'Google OAuth',
      'Unlimited projects',
      'API access & analytics',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
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
      'Plan middleware controls',
      'React Native mobile app',
      'Dedicated support & SLA',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

export function PricingTable() {
  return (
    <section id="pricing" className="pricing-table-section">
      <h2 className="pricing-table-section__title">Simple Pricing</h2>
      <p className="pricing-table-section__subtitle">
        No hidden fees. Start free, upgrade when you&apos;re ready.
      </p>
      <div className="pricing-table">
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            className={`pricing-table__card${plan.highlight ? ' pricing-table__card--highlight' : ''}`}
          >
            {plan.highlight && (
              <span className="pricing-table__badge">Most Popular</span>
            )}
            <h3 className="pricing-table__name">{plan.name}</h3>
            <p className="pricing-table__description">{plan.description}</p>
            <div className="pricing-table__price">
              <span className="pricing-table__amount">${plan.price}</span>
              {plan.price > 0 && (
                <span className="pricing-table__period">/mo</span>
              )}
            </div>
            <ul className="pricing-table__features">
              {plan.features.map((feature) => (
                <li key={feature} className="pricing-table__feature">
                  <span className="pricing-table__check" aria-hidden="true">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <CTAButton
              to="/register"
              variant={plan.highlight ? 'primary' : 'secondary'}
              className="cta-button--full"
            >
              {plan.cta}
            </CTAButton>
          </article>
        ))}
      </div>
    </section>
  );
}
