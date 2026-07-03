import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import AppLayout from '../layouts/AppLayout.jsx';
import PlanBadge from '../components/PlanBadge.jsx';
import FeatureRow from '../components/FeatureRow.jsx';
import { getStoredUser } from '../utils/auth.js';
import { apiFetch, syncUserSession } from '../utils/api.js';

const PLAN_FEATURES = {
  free: ['Basic dashboard access', 'Up to 3 projects', 'Community support'],
  pro: ['Everything in Free', 'Unlimited projects', 'API access', 'Priority support badge', 'Advanced analytics'],
  enterprise: ['Everything in Pro', 'Admin panel access', 'White-label option', 'Dedicated support', 'SLA guarantee'],
};

export default function BillingTab() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const loadData = async () => {
    const storedUser = await getStoredUser();
    setUser(storedUser);
    try {
      const res = await apiFetch('/billing/status');
      setStatus(await res.json());
    } catch (err) {
      console.error('Billing status error:', err);
    }
  };

  useEffect(() => {
    syncUserSession().then((u) => u && setUser(u)).finally(loadData);
  }, []);

  const handleUpgrade = async (plan) => {
    try {
      const res = await apiFetch('/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      if (data.url) Linking.openURL(data.url);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Cancel at the end of this billing period? You keep access until then.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelLoading(true);
            try {
              const res = await apiFetch('/billing/cancel', { method: 'POST' });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              Alert.alert('Scheduled', data.message || 'Subscription will cancel at period end.');
              await loadData();
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setCancelLoading(false);
            }
          },
        },
      ],
    );
  };

  const plan = status?.plan || user?.plan || 'free';
  const features = PLAN_FEATURES[plan] || PLAN_FEATURES.free;

  return (
    <AppLayout title="Billing">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Plan</Text>
          <View style={styles.planRow}>
            <PlanBadge plan={plan} size="lg" />
            {status?.subscription && (
              <Text style={styles.renewText}>
                Renews {new Date(status.subscription.currentPeriodEnd * 1000).toLocaleDateString()}
              </Text>
            )}
          </View>
          <Text style={styles.featuresTitle}>Included Features</Text>
          {features.map((f) => (
            <FeatureRow key={f} label={f} included />
          ))}
        </View>

        {plan === 'free' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Upgrade Your Plan</Text>
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: '#6366f1' }]}
              onPress={() => handleUpgrade('pro')}
            >
              <Text style={styles.upgradeBtnText}>Upgrade to Pro — $19/mo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: '#0f172a', marginTop: 10 }]}
              onPress={() => handleUpgrade('enterprise')}
            >
              <Text style={styles.upgradeBtnText}>Upgrade to Enterprise — $99/mo</Text>
            </TouchableOpacity>
            <Text style={styles.stripeNote}>
              You'll be redirected to Stripe to complete payment.
            </Text>
          </View>
        )}

        {plan !== 'free' && status?.subscription && !status.subscription.cancelAtPeriodEnd && (
          <TouchableOpacity
            style={[styles.cancelBtn, cancelLoading && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={cancelLoading}
          >
            <Text style={styles.cancelBtnText}>
              {cancelLoading ? 'Cancelling...' : 'Cancel Subscription'}
            </Text>
          </TouchableOpacity>
        )}

        {status?.subscription?.cancelAtPeriodEnd && (
          <View style={styles.cancelledBanner}>
            <Text style={styles.cancelledText}>
              Your subscription is set to cancel at the end of the billing period.
            </Text>
          </View>
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 12 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  renewText: { fontSize: 13, color: '#64748b' },
  featuresTitle: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 10 },
  upgradeBtn: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stripeNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 12,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  cancelBtnText: { color: '#dc2626', fontWeight: '600', fontSize: 14 },
  cancelledBanner: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 8,
    padding: 12,
  },
  cancelledText: { fontSize: 13, color: '#92400e' },
});
