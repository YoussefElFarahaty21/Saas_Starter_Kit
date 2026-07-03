import { useState } from 'react';
import config from '../config.js';
import { getToken } from '../utils/auth.js';
import './GenerateKeyModal.css';

export function GenerateKeyModal({ onClose, onSuccess }) {
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawKey, setRawKey] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');

    if (!label.trim()) {
      setError('Please enter a label');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${config.api_url}/apikeys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ label: label.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate API key');

      setRawKey(data.key);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  return (
    <div className="generate-key-overlay" onClick={onClose} role="presentation">
      <div
        className="generate-key-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="generate-key-title"
      >
        <div className="generate-key-modal__header">
          <h2 id="generate-key-title">
            {rawKey ? 'API Key Created' : 'Generate New Key'}
          </h2>
          <button type="button" className="generate-key-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {error && <div className="generate-key-modal__error">{error}</div>}

        {!rawKey ? (
          <form className="generate-key-modal__form" onSubmit={handleGenerate}>
            <label className="generate-key-modal__label" htmlFor="key-label">
              Label
            </label>
            <input
              id="key-label"
              className="generate-key-modal__input"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="My App, Postman, CI…"
              required
              autoFocus
            />
            <div className="generate-key-modal__actions">
              <button type="button" className="generate-key-modal__btn generate-key-modal__btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="generate-key-modal__btn generate-key-modal__btn--primary"
                disabled={loading}
              >
                {loading ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </form>
        ) : (
          <div className="generate-key-modal__result">
            <p className="generate-key-modal__warning generate-key-modal__warning--info">
              You can copy this key anytime from your API keys list.
            </p>
            <div className="generate-key-modal__copy-row">
              <input
                className="generate-key-modal__input generate-key-modal__input--key"
                type="text"
                value={rawKey}
                readOnly
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                className="generate-key-modal__btn generate-key-modal__btn--primary"
                onClick={handleCopy}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              type="button"
              className="generate-key-modal__btn generate-key-modal__btn--ghost generate-key-modal__btn--full"
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
