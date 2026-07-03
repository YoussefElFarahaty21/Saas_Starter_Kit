import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import config from '../config.js';
import { getToken, getStoredUser } from '../utils/auth.js';
import './UsageMeter.css';

const getBarColor = (percent) => {
  if (percent > 90) return 'red';
  if (percent >= 70) return 'yellow';
  return 'green';
};

export function UsageMeter() {
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState('');
  const user = getStoredUser();
  const plan = user?.plan || 'free';

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${config.api_url}/usage/today`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load usage');
        if (!cancelled) setUsage(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="usage-meter usage-meter--error">
        <p className="usage-meter__error">{error}</p>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="usage-meter usage-meter--loading">
        <p className="usage-meter__label">Loading usage…</p>
      </div>
    );
  }

  const { count, limit } = usage;
  const unlimited = limit === -1;
  // Unlimited plans use a soft scale so the bar still grows with usage.
  const displayLimit = unlimited ? 1000 : limit;
  const percent =
    count <= 0 || displayLimit <= 0
      ? 0
      : Math.min(100, (count / displayLimit) * 100);
  const barColor = unlimited ? 'green' : getBarColor(percent);
  const showUpgrade = plan === 'free' && !unlimited && percent > 80;

  return (
    <div className="usage-meter">
      <div className="usage-meter__header">
        <p className="usage-meter__label">
          {unlimited
            ? `${count} API calls used today`
            : `${count} / ${limit} API calls used today`}
        </p>
        {showUpgrade && (
          <Link to="/billing" className="usage-meter__upgrade">
            Upgrade to Pro
          </Link>
        )}
      </div>
      <div
        className="usage-meter__track"
        role="progressbar"
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={unlimited ? undefined : limit}
      >
        <div
          className={`usage-meter__fill usage-meter__fill--${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {!unlimited && (
        <p className="usage-meter__remaining">
          {Math.max(0, limit - count)} remaining today
        </p>
      )}
    </div>
  );
}
