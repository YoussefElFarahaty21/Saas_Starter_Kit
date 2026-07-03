import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AuthLayout from '../layouts/AuthLayout.jsx';
import config from '../config.json';
import { setTokens, setStoredUser } from '../utils/auth.js';

export default function Login({ navigation }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${config.api_url}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      await setTokens(data.accessToken, data.refreshToken);
      await setStoredUser(data.user);
      navigation.reset({ index: 0, routes: [{ name: 'AppTabs' }] });
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.email}
        onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        value={form.password}
        onChangeText={(v) => setForm((p) => ({ ...p, password: v }))}
      />
      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.googleBtn}
        onPress={() => Alert.alert('Google OAuth', 'Integrate Google Sign-In SDK and POST idToken to /auth/google')}
      >
        <Text style={styles.googleBtnText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Register')}
        style={styles.link}
      >
        <Text style={styles.linkText}>
          Don't have an account? <Text style={styles.linkHighlight}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  btn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnDisabled: { backgroundColor: '#a5b4fc' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { fontSize: 12, color: '#94a3b8' },
  googleBtn: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 13,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  googleBtnText: { color: '#374151', fontWeight: '500', fontSize: 14 },
  link: { alignItems: 'center', marginTop: 4 },
  linkText: { fontSize: 14, color: '#64748b' },
  linkHighlight: { color: '#6366f1', fontWeight: '600' },
});
