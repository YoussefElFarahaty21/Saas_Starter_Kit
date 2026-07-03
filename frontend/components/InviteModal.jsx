import { useState } from 'react';
import config from '../config.js';
import { getToken } from '../utils/auth.js';
import './InviteModal.css';

export function InviteModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${config.api_url}/team/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to send invite');

      setSuccess(`Invite sent to ${email.trim()}`);
      setEmail('');
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invite-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="invite-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="invite-modal-title"
      >
        <div className="invite-modal__header">
          <h2 id="invite-modal-title">Invite Member</h2>
          <button type="button" className="invite-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {error && <div className="invite-modal__error">{error}</div>}
        {success && <div className="invite-modal__success">{success}</div>}

        <form className="invite-modal__form" onSubmit={handleSubmit}>
          <label className="invite-modal__label" htmlFor="invite-email">
            Email address
          </label>
          <input
            id="invite-email"
            className="invite-modal__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
            autoFocus
          />
          <div className="invite-modal__actions">
            <button type="button" className="invite-modal__btn invite-modal__btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="invite-modal__btn invite-modal__btn--primary" disabled={loading}>
              {loading ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
