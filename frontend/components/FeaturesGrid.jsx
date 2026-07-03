import './FeaturesGrid.css';

const FEATURES = [
  {
    icon: '🔐',
    title: 'JWT Auth',
    description: 'Access and refresh tokens with secure session handling out of the box.',
  },
  {
    icon: '🌐',
    title: 'Google OAuth',
    description: 'One-click sign-in with Google — no custom OAuth flow to maintain.',
  },
  {
    icon: '💳',
    title: 'Stripe Billing',
    description: 'Subscription plans, checkout, and webhooks wired and ready to go.',
  },
  {
    icon: '🛡',
    title: 'Plan Middleware',
    description: 'Gate routes and features by subscription tier on both client and server.',
  },
  {
    icon: '⚙️',
    title: 'Admin Panel',
    description: 'Manage users, plans, and roles from a dedicated admin dashboard.',
  },
  {
    icon: '📱',
    title: 'React Native Mobile',
    description: 'Companion mobile app scaffold sharing the same auth and API layer.',
  },
];

export function FeaturesGrid() {
  return (
    <section className="features-grid-section">
      <h2 className="features-grid-section__title">Everything Included</h2>
      <p className="features-grid-section__subtitle">
        Ship faster with a full-stack foundation built for real SaaS products.
      </p>
      <div className="features-grid">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="features-grid__card">
            <div className="features-grid__icon" aria-hidden="true">
              {feature.icon}
            </div>
            <h3 className="features-grid__title">{feature.title}</h3>
            <p className="features-grid__description">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
