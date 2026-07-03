import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppLayout from '../layouts/AppLayout.jsx';
import { getStoredUser, setStoredUser } from '../utils/auth.js';
import { apiFetch, logout } from '../utils/api.js';

const inputStyle = {
  borderWidth: 1,
  borderColor: '#e2e8f0',
  borderRadius: 8,
  padding: 12,
  fontSize: 14,
  marginBottom: 12,
  color: '#0f172a',
  backgroundColor: '#fff',
};

export default function ProfileTab() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    getStoredUser().then((u) => {
      if (u) setProfile({ name: u.name || '', email: u.email || '' });
    });
  }, []);

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      const res = await apiFetch('/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      const current = await getStoredUser();
      await setStoredUser({ ...current, ...data.user });
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }
    setPwLoading(true);
    try {
      const res = await apiFetch('/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwords),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password change failed');
      Alert.alert('Success', 'Password updated successfully');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This permanently deletes your account. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleteLoading(true);
          try {
            const res = await apiFetch('/user/account', { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Deletion failed');
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Auth', params: { screen: 'Landing' } }] });
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setDeleteLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <AppLayout title="Profile">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={inputStyle}
            value={profile.name}
            onChangeText={(v) => setProfile((p) => ({ ...p, name: v }))}
            placeholder="Your name"
            placeholderTextColor="#94a3b8"
          />
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={inputStyle}
            value={profile.email}
            onChangeText={(v) => setProfile((p) => ({ ...p, email: v }))}
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.btn, profileLoading && styles.btnDisabled]}
            onPress={handleProfileSave}
            disabled={profileLoading}
          >
            <Text style={styles.btnText}>{profileLoading ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change Password</Text>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={inputStyle}
            value={passwords.currentPassword}
            onChangeText={(v) => setPasswords((p) => ({ ...p, currentPassword: v }))}
            secureTextEntry
            placeholder="Current password"
            placeholderTextColor="#94a3b8"
          />
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={inputStyle}
            value={passwords.newPassword}
            onChangeText={(v) => setPasswords((p) => ({ ...p, newPassword: v }))}
            secureTextEntry
            placeholder="Min. 8 characters"
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity
            style={[styles.btn, pwLoading && styles.btnDisabled]}
            onPress={handlePasswordChange}
            disabled={pwLoading}
          >
            <Text style={styles.btnText}>{pwLoading ? 'Updating...' : 'Update Password'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.dangerCard]}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.dangerText}>Permanently delete your account.</Text>
          <TouchableOpacity
            style={[styles.dangerBtn, deleteLoading && styles.btnDisabled]}
            onPress={handleDeleteAccount}
            disabled={deleteLoading}
          >
            <Text style={styles.dangerBtnText}>{deleteLoading ? 'Deleting...' : 'Delete Account'}</Text>
          </TouchableOpacity>
        </View>
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
  dangerCard: { borderColor: '#fecaca' },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 16,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 8,
  },
  dangerText: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  btn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { backgroundColor: '#a5b4fc' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  dangerBtn: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff',
  },
  dangerBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
});
