import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import config from '../config.js';
import './AcceptInvite.css';

export function AcceptInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const accept = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid or expired invite link');
        return;
      }

      try {
        const res = await fetch(
          `${config.api_url}/team/invite/accept?token=${encodeURIComponent(token)}`,
        );
        const data = await res.json();
        if (cancelled) return;

        if (data.code === 'ACCOUNT_REQUIRED') {
          const params = new URLSearchParams();
          if (data.email) params.set('email', data.email);
          params.set('invite', token);
          navigate(`/register?${params.toString()}`, { replace: true });
          return;
        }

        if (!res.ok) {
          setStatus('error');
          setMessage(data.error || 'Invalid or expired invite link');
          return;
        }

        setStatus('success');
        setMessage(data.message || 'You joined the team!');
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Invalid or expired invite link');
        }
      }
    };

    accept();
    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  return (
    <div className="accept-invite">
      <div className="accept-invite__card">
        <div className="accept-invite__brand">SaaS Kit</div>

        {status === 'loading' && (
          <>
            <h1>Accepting invite…</h1>
            <p>Please wait while we add you to the team.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1>You joined the team!</h1>
            <p>{message}</p>
            <Link to="/login" className="accept-invite__link">
              Sign in to continue
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h1>Invite unavailable</h1>
            <p>{message || 'Invalid or expired invite link'}</p>
            <Link to="/register" className="accept-invite__link accept-invite__link--secondary">
              Create an account
            </Link>
            <Link to="/login" className="accept-invite__link">
              Sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
