import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { DashboardLayout } from '../layouts/DashboardLayout.jsx';
import { PlanBadge } from '../components/PlanBadge.jsx';
import { SkeletonCard } from '../components/SkeletonCard.jsx';
import { UsageMeter } from '../components/UsageMeter.jsx';
import { getStoredUser } from '../utils/auth.js';
import { apiFetch } from '../utils/api.js';
import './Dashboard.css';

const STAT_CARDS = [
  { label: 'Projects', free: 3, pro: Infinity, enterprise: Infinity, icon: '📁', numeric: true },
  { label: 'API Calls / day', free: 10, pro: 1000, enterprise: Infinity, icon: '⚡', numeric: true },
  { label: 'Team Members', free: 1, pro: 5, enterprise: Infinity, icon: '👥', numeric: true },
  { label: 'Storage', free: '100 MB', pro: '10 GB', enterprise: '100 GB', icon: '💾', numeric: false },
];

function AnimatedNumber({ value }) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) => {
    if (!Number.isFinite(value)) return '∞';
    return Math.round(latest).toLocaleString();
  });

  useEffect(() => {
    if (!Number.isFinite(value)) {
      motionValue.set(0);
      return undefined;
    }
    const controls = animate(motionValue, value, { duration: 0.8, ease: 'easeOut' });
    return controls.stop;
  }, [motionValue, value]);

  if (!Number.isFinite(value)) {
    return <span>∞</span>;
  }

  return <motion.span>{display}</motion.span>;
}

export function Dashboard() {
  const user = getStoredUser();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/billing/status')
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const plan = status?.plan || user?.plan || 'free';

  return (
    <DashboardLayout>
      <div className="dashboard__header">
        <div className="dashboard__title-row">
          <h1 className="dashboard__title">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <PlanBadge plan={plan} size="lg" />
        </div>
        <p className="dashboard__subtitle">Here&apos;s an overview of your account usage.</p>
      </div>

      {status?.subscription && (
        <div className="dashboard__banner">
          <span>
            ✓ Active subscription — renews{' '}
            {new Date(status.subscription.currentPeriodEnd * 1000).toLocaleDateString()}
          </span>
          {status.subscription.cancelAtPeriodEnd && (
            <span className="dashboard__banner-warn">Cancels at period end</span>
          )}
        </div>
      )}

      <UsageMeter />

      {loading ? (
        <div className="dashboard__skeleton-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="dashboard__stats">
          {STAT_CARDS.map((card, index) => {
            const raw = card[plan] ?? card.free;
            return (
              <motion.div
                key={card.label}
                className="dashboard__stat-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.1 }}
              >
                <div className="dashboard__stat-icon">{card.icon}</div>
                <div className="dashboard__stat-value">
                  {card.numeric ? <AnimatedNumber value={raw} /> : raw}
                </div>
                <div className="dashboard__stat-label">{card.label}</div>
              </motion.div>
            );
          })}
        </div>
      )}

      {plan === 'free' && (
        <div className="dashboard__upgrade">
          <div>
            <h3>Unlock more with Pro</h3>
            <p>Unlimited projects, API access, and priority support — from $19/mo.</p>
          </div>
          <a href="/billing" className="dashboard__upgrade-btn">
            Upgrade Now →
          </a>
        </div>
      )}
    </DashboardLayout>
  );
}
