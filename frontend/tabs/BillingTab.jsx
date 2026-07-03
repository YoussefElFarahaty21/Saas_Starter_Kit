import { useState, useEffect, useCallback } from 'react';

import { useSearchParams } from 'react-router-dom';

import { DashboardLayout } from '../layouts/DashboardLayout.jsx';

import { PlanBadge } from '../components/PlanBadge.jsx';

import { PricingCard } from '../components/PricingCard.jsx';

import { SkeletonCard } from '../components/SkeletonCard.jsx';

import { SkeletonRow } from '../components/SkeletonRow.jsx';

import { UsageMeter } from '../components/UsageMeter.jsx';

import { getStoredUser } from '../utils/auth.js';

import { apiFetch, syncUserSession } from '../utils/api.js';



export function BillingTab() {

  const [searchParams, setSearchParams] = useSearchParams();

  const [user, setUser] = useState(getStoredUser());

  const [status, setStatus] = useState(null);

  const [invoices, setInvoices] = useState([]);

  const [cancelLoading, setCancelLoading] = useState(false);

  const [cancelMsg, setCancelMsg] = useState('');

  const [bannerMsg, setBannerMsg] = useState('');

  const [showPlans, setShowPlans] = useState(false);

  const [loading, setLoading] = useState(true);



  const loadBilling = useCallback(async () => {

    try {

      const [statusRes, invoicesRes] = await Promise.all([

        apiFetch('/billing/status'),

        apiFetch('/billing/invoices'),

      ]);

      const s = await statusRes.json();

      const inv = await invoicesRes.json();

      setStatus(s);

      setInvoices(inv.invoices || []);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    const success = searchParams.get('success');

    const cancelled = searchParams.get('cancelled');



    if (success === 'true') {

      setBannerMsg('Payment successful! Your plan has been updated.');

      setSearchParams({}, { replace: true });

      syncUserSession().then((u) => {

        if (u) setUser(u);

        loadBilling();

      });

    } else if (cancelled === 'true') {

      setBannerMsg('Checkout was cancelled. No charges were made.');

      setSearchParams({}, { replace: true });

    } else {

      loadBilling();

    }

  }, [searchParams, setSearchParams, loadBilling]);



  const handleCancel = async () => {

    if (!window.confirm('Cancel at the end of this billing period? You keep access until then.')) return;

    setCancelLoading(true);

    setCancelMsg('');

    try {

      const res = await apiFetch('/billing/cancel', { method: 'POST' });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Cancellation failed');

      setCancelMsg(data.message || 'Subscription scheduled for cancellation.');

      await loadBilling();

    } catch (err) {

      setCancelMsg(err.message);

    } finally {

      setCancelLoading(false);

    }

  };



  const handleUpgrade = async (plan) => {

    try {

      const res = await apiFetch('/billing/subscribe', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ plan }),

      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      if (data.url) window.location.href = data.url;

    } catch (err) {

      console.error('Upgrade error:', err);

      setBannerMsg(err.message);

    }

  };



  const plan = user?.plan || status?.plan || 'free';



  if (loading) {
    return (
      <DashboardLayout>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>Billing</h1>
        <div style={{ display: 'grid', gap: '16px' }}>
          <SkeletonCard />
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <SkeletonRow columns={4} />
                <SkeletonRow columns={4} />
                <SkeletonRow columns={4} />
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (

    <DashboardLayout>

      <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>Billing</h1>

      {bannerMsg && (

        <div

          style={{

            marginBottom: '16px',

            padding: '12px 16px',

            background: 'var(--accent-soft)',

            border: '1px solid #c7d2fe',

            borderRadius: '8px',

            fontSize: '14px',

            color: 'var(--accent-soft-text)',

          }}

        >

          {bannerMsg}

        </div>

      )}



      {/* Current plan */}

      <div

        style={{

          background: 'var(--card-bg)',

          border: '1px solid #e2e8f0',

          borderRadius: '12px',

          padding: '28px',

          marginBottom: '24px',

        }}

      >

        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Current Plan</h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            <PlanBadge plan={plan} size="lg" />

            {status?.subscription && (

              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>

                Renews {new Date(status.subscription.currentPeriodEnd * 1000).toLocaleDateString()}

              </span>

            )}

          </div>

          <div style={{ display: 'flex', gap: '10px' }}>

            {plan === 'free' && (

              <button

                onClick={() => setShowPlans((v) => !v)}

                style={{

                  padding: '9px 20px',

                  background: 'var(--accent)',
                  color: 'var(--text-inverse)',

                  border: 'none',

                  borderRadius: '8px',

                  fontWeight: 600,

                  fontSize: '13px',

                  cursor: 'pointer',

                }}

              >

                Upgrade Plan

              </button>

            )}

            {plan !== 'free' && status?.subscription && !status.subscription.cancelAtPeriodEnd && (

              <button

                onClick={handleCancel}

                disabled={cancelLoading}

                style={{

                  padding: '9px 20px',

                  background: 'var(--card-bg)',

                  color: 'var(--danger)',

                  border: '1px solid #fecaca',

                  borderRadius: '8px',

                  fontWeight: 600,

                  fontSize: '13px',

                  cursor: cancelLoading ? 'default' : 'pointer',

                }}

              >

                {cancelLoading ? 'Cancelling...' : 'Cancel Subscription'}

              </button>

            )}

            {status?.subscription?.cancelAtPeriodEnd && (

              <span style={{ fontSize: '13px', color: 'var(--warning)', fontWeight: 600 }}>

                Cancels at period end

              </span>

            )}

          </div>

        </div>

        {cancelMsg && (

          <div

            style={{

              marginTop: '16px',

              padding: '10px 14px',

              background: 'var(--success-bg)',

              border: '1px solid #86efac',

              borderRadius: '8px',

              fontSize: '13px',

              color: 'var(--success)',

            }}

          >

            {cancelMsg}

          </div>

        )}

      </div>

      <UsageMeter />

      {showPlans && (

        <div

          style={{

            background: 'var(--card-bg)',

            border: '1px solid #e2e8f0',

            borderRadius: '12px',

            padding: '28px',

            marginBottom: '24px',

          }}

        >

          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-primary)' }}>Choose a Plan</h2>

          <PricingCard currentPlan={plan} onUpgrade={handleUpgrade} />

        </div>

      )}



      <div

        style={{

          background: 'var(--card-bg)',

          border: '1px solid #e2e8f0',

          borderRadius: '12px',

          padding: '28px',

        }}

      >

        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Invoice History</h2>

        {invoices.length === 0 ? (

          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No invoices yet.</p>

        ) : (

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>

            <thead>

              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>

                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Date</th>

                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Amount</th>

                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>

                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Invoice</th>

              </tr>

            </thead>

            <tbody>

              {invoices.map((inv, i) => (

                <tr key={inv.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>

                  <td style={{ padding: '12px 0' }}>

                    {inv.created ? new Date(inv.created * 1000).toLocaleDateString() : '—'}

                  </td>

                  <td style={{ padding: '12px 0' }}>

                    ${((inv.amount_paid || 0) / 100).toFixed(2)}

                  </td>

                  <td style={{ padding: '12px 0' }}>

                    <span

                      style={{

                        padding: '3px 10px',

                        borderRadius: '999px',

                        fontSize: '12px',

                        fontWeight: 600,

                        background: inv.status === 'paid' ? '#dcfce7' : 'var(--danger-bg)',

                        color: inv.status === 'paid' ? 'var(--success)' : 'var(--danger)',

                      }}

                    >

                      {inv.status}

                    </span>

                  </td>

                  <td style={{ padding: '12px 0' }}>

                    {inv.hosted_invoice_url ? (

                      <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 500 }}>

                        View ↗

                      </a>

                    ) : '—'}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

    </DashboardLayout>

  );

}

