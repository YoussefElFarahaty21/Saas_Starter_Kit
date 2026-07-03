import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import FeatureRow from '../components/FeatureRow.jsx';

const FEATURES = [
  'JWT Auth + Google OAuth',
  'Stripe subscription billing',
  'Firebase Firestore database',
  'Free, Pro & Enterprise plans',
  'Email notifications',
  'Admin dashboard',
];

export default function Landing({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.brand}>SaaS Kit</Text>
          <Text style={styles.headline}>Build Your SaaS{'\n'}10x Faster</Text>
          <Text style={styles.sub}>
            A production-ready full-stack boilerplate with auth, billing, and admin panels built in.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.primaryBtnText}>Get Started Free →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Everything Included</Text>
          {FEATURES.map((f) => (
            <FeatureRow key={f} label={f} included />
          ))}
        </View>

        {/* Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Simple Pricing</Text>
          {[
            { name: 'Free', price: '$0/mo', color: '#f1f5f9', textColor: '#475569' },
            { name: 'Pro', price: '$19/mo', color: '#ede9fe', textColor: '#7c3aed' },
            { name: 'Enterprise', price: '$99/mo', color: '#fef3c7', textColor: '#b45309' },
          ].map((p) => (
            <View
              key={p.name}
              style={[styles.planCard, { backgroundColor: p.color }]}
            >
              <Text style={[styles.planName, { color: p.textColor }]}>{p.name}</Text>
              <Text style={[styles.planPrice, { color: p.textColor }]}>{p.price}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { marginHorizontal: 20, marginBottom: 40 }]}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.primaryBtnText}>Create Free Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flexGrow: 1 },
  hero: {
    padding: 32,
    paddingTop: 48,
    alignItems: 'center',
    backgroundColor: '#eef2ff',
  },
  brand: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
    letterSpacing: 2,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
  },
  sub: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  primaryBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#c7d2fe',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryBtnText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  planCard: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: { fontSize: 16, fontWeight: '700' },
  planPrice: { fontSize: 15, fontWeight: '600' },
});
