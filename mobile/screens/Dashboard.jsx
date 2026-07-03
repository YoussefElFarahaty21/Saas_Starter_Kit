import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import AppLayout from '../layouts/AppLayout.jsx';
import PlanBadge from '../components/PlanBadge.jsx';
import config from '../config.json';
import { getToken, getStoredUser } from '../utils/auth.js';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const storedUser = await getStoredUser();
      setUser(storedUser);
      const token = await getToken();
      try {
        const res = await fetch(`${config.api_url}/billing/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        console.error('Failed to load billing status:', err);
      }
    };
    loadData();
  }, []);

  const plan = user?.plan || 'free';

  const handleUpgrade = async () => {
    const token = await getToken();
    try {
      const res = await fetch(`${config.api_url}/billing/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: 'pro' }),
      });
      const data = await res.json();
      if (data.url) Linking.openURL(data.url);
    } catch (err) {
      console.error('Upgrade error:', err);
    }
  };

  return (
    <AppLayout>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Welcome */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeRow}>
            <Text style={styles.welcomeText}>
              Welcome, {user?.name?.split(' ')[0] || 'there'}!
            </Text>
            <PlanBadge plan={plan} size="lg" />
          </View>
          <Text style={styles.welcomeSub}>Your account overview</Text>
        </View>

        {/* Subscription banner */}
        {status?.subscription && (
          <View style={styles.subBanner}>
            <Text style={styles.subBannerText}>
              ✓ Active subscription — renews{' '}
              {new Date(status.subscription.currentPeriodEnd * 1000).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Stat cards */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Projects', value: plan === 'free' ? '3' : '∞', icon: '📁' },
            { label: 'API Calls/day', value: plan === 'free' ? '100' : plan === 'pro' ? '10K' : '∞', icon: '⚡' },
            { label: 'Team Members', value: plan === 'free' ? '1' : plan === 'pro' ? '5' : '∞', icon: '👥' },
            { label: 'Storage', value: plan === 'free' ? '100MB' : plan === 'pro' ? '10GB' : '100GB', icon: '💾' },
          ].map((card) => (
            <View key={card.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{card.icon}</Text>
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Upgrade CTA */}
        {plan === 'free' && (
          <View style={styles.upgradeBanner}>
            <Text style={styles.upgradeTitle}>Unlock more with Pro</Text>
            <Text style={styles.upgradeSub}>
              Unlimited projects, API access, and priority support — from $19/mo.
            </Text>
            <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
              <Text style={styles.upgradeBtnText}>Upgrade Now →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  welcomeText: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  welcomeSub: { fontSize: 13, color: '#64748b' },
  subBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  subBannerText: { fontSize: 13, color: '#166534', fontWeight: '500' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 16,
    width: '47%',
    alignItems: 'center',
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  upgradeBanner: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 12,
    padding: 20,
  },
  upgradeTitle: { fontSize: 16, fontWeight: '700', color: '#3730a3', marginBottom: 6 },
  upgradeSub: { fontSize: 13, color: '#4338ca', lineHeight: 20, marginBottom: 14 },
  upgradeBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
