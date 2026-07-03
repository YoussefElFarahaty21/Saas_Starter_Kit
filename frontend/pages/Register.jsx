import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { GoogleSignInButton } from '../components/GoogleSignInButton.jsx';
import config from '../config.js';
import { setTokens, setStoredUser, getPostAuthRedirect, toStoredUser } from '../utils/auth.js';

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

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite') || '';
  const inviteEmail = searchParams.get('email') || '';

  const [form, setForm] = useState({
    name: '',
    email: inviteEmail,
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const acceptPendingInvite = async () => {
    if (!inviteToken) return;
    try {
      await fetch(
        `${config.api_url}/team/invite/accept?token=${encodeURIComponent(inviteToken)}`,
      );
    } catch {
      // Non-fatal — user can open the invite link again
    }
  };

  const handleAuthSuccess = async (data) => {
    setTokens(data.accessToken, data.refreshToken);
    setStoredUser(toStoredUser(data.user));
    await acceptPendingInvite();
    navigate(getPostAuthRedirect(data.user));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (inviteEmail && form.email.trim().toLowerCase() !== inviteEmail.trim().toLowerCase()) {
      setError(`Please register with the invited email: ${inviteEmail}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${config.api_url}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      await handleAuthSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (idToken) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${config.api_url}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google authentication failed');
      if (
        inviteEmail &&
        data.user?.email?.toLowerCase() !== inviteEmail.trim().toLowerCase()
      ) {
        setError(`Please sign up with the invited email: ${inviteEmail}`);
        return;
      }
      await handleAuthSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle={
        inviteToken
          ? 'Create your account to join the team'
          : 'Start building for free today'
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--danger-bg)',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: 'var(--danger)',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Full Name
          </label>
          <input
            style={inputStyle}
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Jane Doe"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Email
          </label>
          <input
            style={inputStyle}
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            readOnly={Boolean(inviteEmail)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Password
          </label>
          <input
            style={inputStyle}
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Min. 8 characters"
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            background: loading ? 'var(--accent)' : 'var(--accent)',
            color: 'var(--card-bg)',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '15px',
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <div style={{ position: 'relative', textAlign: 'center', margin: '4px 0' }}>
          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />
          <span
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--card-bg)',
              padding: '0 12px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            OR
          </span>
        </div>

        <GoogleSignInButton
          onSuccess={handleGoogle}
          onError={(err) => setError(err.message)}
          text="signup_with"
        />
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
