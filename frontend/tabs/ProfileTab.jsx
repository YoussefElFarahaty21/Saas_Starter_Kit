import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { getStoredUser, setStoredUser } from '../utils/auth.js';

import { apiFetch, logout } from '../utils/api.js';

import { DashboardLayout } from '../layouts/DashboardLayout.jsx';



const inputStyle = {

  width: '100%',

  padding: '10px 14px',

  border: '1px solid var(--border)',

  borderRadius: '8px',

  fontSize: '14px',

  color: 'var(--text-primary)',

  background: 'var(--bg-secondary)',

  outline: 'none',

  boxSizing: 'border-box',

};



const sectionStyle = {

  background: 'var(--card-bg)',

  border: '1px solid #e2e8f0',

  borderRadius: '12px',

  padding: '28px',

  marginBottom: '24px',

};



export function ProfileTab() {

  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: '', email: '' });

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  const [deleteMsg, setDeleteMsg] = useState({ type: '', text: '' });

  const [profileLoading, setProfileLoading] = useState(false);

  const [pwLoading, setPwLoading] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);



  useEffect(() => {

    const user = getStoredUser();

    if (user) setProfile({ name: user.name || '', email: user.email || '' });

  }, []);



  const handleProfileSave = async (e) => {

    e.preventDefault();

    setProfileMsg({ type: '', text: '' });

    setProfileLoading(true);

    try {

      const res = await apiFetch('/user/profile', {

        method: 'PUT',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(profile),

      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Update failed');

      setStoredUser({ ...getStoredUser(), ...data.user });

      setProfileMsg({ type: 'success', text: 'Profile updated successfully' });

    } catch (err) {

      setProfileMsg({ type: 'error', text: err.message });

    } finally {

      setProfileLoading(false);

    }

  };



  const handlePasswordChange = async (e) => {

    e.preventDefault();

    setPwMsg({ type: '', text: '' });

    if (passwords.newPassword.length < 8) {

      setPwMsg({ type: 'error', text: 'New password must be at least 8 characters' });

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

      setPwMsg({ type: 'success', text: 'Password changed successfully' });

      setPasswords({ currentPassword: '', newPassword: '' });

    } catch (err) {

      setPwMsg({ type: 'error', text: err.message });

    } finally {

      setPwLoading(false);

    }

  };



  const handleDeleteAccount = async () => {

    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return;

    setDeleteLoading(true);

    setDeleteMsg({ type: '', text: '' });

    try {

      const res = await apiFetch('/user/account', { method: 'DELETE' });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Deletion failed');

      await logout();

      navigate('/login');

    } catch (err) {

      setDeleteMsg({ type: 'error', text: err.message });

    } finally {

      setDeleteLoading(false);

    }

  };



  const msgStyle = (type) => ({

    padding: '10px 14px',

    borderRadius: '8px',

    fontSize: '13px',

    background: type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',

    border: `1px solid ${type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`,

    color: type === 'success' ? 'var(--success)' : 'var(--danger)',

    marginBottom: '16px',

  });



  return (

    <DashboardLayout>

      <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>Profile</h1>



      <div style={sectionStyle}>

        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Personal Information</h2>

        {profileMsg.text && <div style={msgStyle(profileMsg.type)}>{profileMsg.text}</div>}

        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>

          <div>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>

              Full Name

            </label>

            <input

              style={inputStyle}

              type="text"

              value={profile.name}

              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}

              required

            />

          </div>

          <div>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>

              Email Address

            </label>

            <input

              style={inputStyle}

              type="email"

              value={profile.email}

              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}

              required

            />

          </div>

          <div>

            <button

              type="submit"

              disabled={profileLoading}

              style={{

                padding: '10px 24px',

                background: profileLoading ? 'var(--accent)' : 'var(--accent)',

                color: 'var(--card-bg)',

                border: 'none',

                borderRadius: '8px',

                fontWeight: 600,

                fontSize: '14px',

                cursor: profileLoading ? 'default' : 'pointer',

              }}

            >

              {profileLoading ? 'Saving...' : 'Save Changes'}

            </button>

          </div>

        </form>

      </div>



      <div style={sectionStyle}>

        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Change Password</h2>

        {pwMsg.text && <div style={msgStyle(pwMsg.type)}>{pwMsg.text}</div>}

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>

          <div>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>

              Current Password

            </label>

            <input

              style={inputStyle}

              type="password"

              value={passwords.currentPassword}

              onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}

              required

            />

          </div>

          <div>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>

              New Password

            </label>

            <input

              style={inputStyle}

              type="password"

              value={passwords.newPassword}

              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}

              required

              minLength={8}

              placeholder="Min. 8 characters"

            />

          </div>

          <div>

            <button

              type="submit"

              disabled={pwLoading}

              style={{

                padding: '10px 24px',

                background: pwLoading ? 'var(--accent)' : 'var(--accent)',

                color: 'var(--card-bg)',

                border: 'none',

                borderRadius: '8px',

                fontWeight: 600,

                fontSize: '14px',

                cursor: pwLoading ? 'default' : 'pointer',

              }}

            >

              {pwLoading ? 'Updating...' : 'Update Password'}

            </button>

          </div>

        </form>

      </div>



      <div style={{ ...sectionStyle, borderColor: 'var(--danger-border)' }}>

        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--danger)' }}>Danger Zone</h2>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>

          Permanently delete your account and all associated data.

        </p>

        {deleteMsg.text && <div style={msgStyle(deleteMsg.type)}>{deleteMsg.text}</div>}

        <button

          type="button"

          onClick={handleDeleteAccount}

          disabled={deleteLoading}

          style={{

            padding: '10px 24px',

            background: 'var(--card-bg)',

            color: 'var(--danger)',

            border: '1px solid #fecaca',

            borderRadius: '8px',

            fontWeight: 600,

            fontSize: '14px',

            cursor: deleteLoading ? 'default' : 'pointer',

          }}

        >

          {deleteLoading ? 'Deleting...' : 'Delete Account'}

        </button>

      </div>

    </DashboardLayout>

  );

}

