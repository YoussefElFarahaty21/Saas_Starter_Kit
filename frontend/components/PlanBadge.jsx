import './PlanBadge.css';

const BADGE_LABELS = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export function PlanBadge({ plan = 'free', size = 'sm' }) {
  const label = BADGE_LABELS[plan] || plan;
  const planClass = BADGE_LABELS[plan] ? plan : 'free';

  return (
    <span className={`plan-badge plan-badge--${size} plan-badge--${planClass}`}>
      {label}
    </span>
  );
}
