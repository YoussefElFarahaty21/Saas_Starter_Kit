import { useState } from 'react';
import config from '../config.js';
import { getToken } from '../utils/auth.js';
import './WebhookModal.css';

const EVENT_OPTIONS = [
  { id: 'user.created', label: 'user.created' },
  { id: 'plan.upgraded', label: 'plan.upgraded' },
  { id: 'plan.cancelled', label: 'plan.cancelled' },
  { id: 'member.invited', label: 'member.invited' },
];

export function WebhookModal({ onClose, onSuccess }) {
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState(['plan.upgraded']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secret, setSecret] = useState('');
  const [copied, setCopied] = useState(false);

  const toggleEvent = (eventId) => {
    setEvents((current) =>
      current.includes(eventId)
        ? current.filter((item) => item !== eventId)
        : [...current, eventId],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Webhook URL is required');
      return;
    }

    if (events.length === 0) {
      setError('Select at least one event');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${config.api_url}/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url: url.trim(), events }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create webhook');

      setSecret(data.secret || data.webhook?.secret || '');
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  return (
    <div className="webhook-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="webhook-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="webhook-modal-title"
      >
        <div className="webhook-modal__header">
          <h2 id="webhook-modal-title">
            {secret ? 'Webhook Created' : 'Add Webhook'}
          </h2>
          <button type="button" className="webhook-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {error && <div className="webhook-modal__error">{error}</div>}

        {!secret ? (
          <form className="webhook-modal__form" onSubmit={handleSubmit}>
            <label className="webhook-modal__label" htmlFor="webhook-url">
              Endpoint URL
            </label>
            <input
              id="webhook-url"
              className="webhook-modal__input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhooks/saas"
              required
              autoFocus
            />

            <p className="webhook-modal__label">Events</p>
            <div className="webhook-modal__events">
              {EVENT_OPTIONS.map((option) => (
                <label key={option.id} className="webhook-modal__checkbox">
                  <input
                    type="checkbox"
                    checked={events.includes(option.id)}
                    onChange={() => toggleEvent(option.id)}
                  />
                  <code>{option.label}</code>
                </label>
              ))}
            </div>

            <div className="webhook-modal__actions">
              <button type="button" className="webhook-modal__btn webhook-modal__btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="webhook-modal__btn webhook-modal__btn--primary"
                disabled={loading}
              >
                {loading ? 'Saving…' : 'Save Webhook'}
              </button>
            </div>
          </form>
        ) : (
          <div className="webhook-modal__result">
            <p className="webhook-modal__info">
              Use this secret to verify the <code>X-Webhook-Signature</code> header (HMAC-SHA256).
            </p>
            <div className="webhook-modal__copy-row">
              <input
                className="webhook-modal__input webhook-modal__input--secret"
                type="text"
                value={secret}
                readOnly
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                className="webhook-modal__btn webhook-modal__btn--primary"
                onClick={handleCopy}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              type="button"
              className="webhook-modal__btn webhook-modal__btn--ghost webhook-modal__btn--full"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
