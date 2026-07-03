import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout.jsx';
import { GenerateKeyModal } from '../components/GenerateKeyModal.jsx';
import config from '../config.js';
import { getToken, hasPlanAccess } from '../utils/auth.js';
import './ApiKeysTab.css';

const formatDate = (value) => {
  if (!value) return '—';
  try {
    if (value._seconds) return new Date(value._seconds * 1000).toLocaleDateString();
    if (value.seconds) return new Date(value.seconds * 1000).toLocaleDateString();
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
};

export function ApiKeysTab() {
  const canManageKeys = hasPlanAccess('pro');
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const authHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadKeys = useCallback(async () => {
    if (!canManageKeys) {
      setLoading(false);
      return;
    }

    setError('');
    try {
      const res = await fetch(`${config.api_url}/apikeys`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load API keys');
      setKeys(data.apiKeys || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [canManageKeys]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCopy = async (key) => {
    if (!key.key) {
      setError('This key was created before copy-anytime support. Revoke it and generate a new one.');
      return;
    }

    try {
      await navigator.clipboard.writeText(key.key);
      setCopiedId(key.id);
      setTimeout(() => setCopiedId((current) => (current === key.id ? null : current)), 2000);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const handleRevoke = async (keyId) => {
    if (!window.confirm('Revoke this API key? Apps using it will stop working.')) return;

    setRevokingId(keyId);
    setError('');
    try {
      const res = await fetch(`${config.api_url}/apikeys/${keyId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke API key');
      await loadKeys();
    } catch (err) {
      setError(err.message);
    } finally {
      setRevokingId(null);
    }
  };

  if (!canManageKeys) {
    return (
      <DashboardLayout>
        <div className="api-keys-tab">
          <h1 className="api-keys-tab__title">API Keys</h1>
          <div className="api-keys-tab__upgrade">
            <h2>API keys are a Pro feature</h2>
            <p>Upgrade to Pro or Enterprise to generate keys for programmatic access.</p>
            <Link to="/billing" className="api-keys-tab__btn api-keys-tab__btn--primary">
              Upgrade Plan
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="api-keys-tab">
        <div className="api-keys-tab__header">
          <div>
            <h1 className="api-keys-tab__title">API Keys</h1>
            <p className="api-keys-tab__subtitle">
              Create keys to access the platform programmatically. Use{' '}
              <code>Authorization: ApiKey &lt;your-key&gt;</code>. You can copy a key anytime.
            </p>
          </div>
          <button
            type="button"
            className="api-keys-tab__btn api-keys-tab__btn--primary"
            onClick={() => setShowModal(true)}
          >
            Generate New Key
          </button>
        </div>

        {error && <div className="api-keys-tab__error">{error}</div>}

        <div className="api-keys-tab__card">
          {loading && <p className="api-keys-tab__muted">Loading keys…</p>}

          {!loading && keys.length === 0 && (
            <p className="api-keys-tab__muted">No API keys yet. Generate one to get started.</p>
          )}

          {!loading && keys.length > 0 && (
            <div className="api-keys-tab__table-wrap">
              <table className="api-keys-tab__table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Key</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr key={key.id}>
                      <td>{key.label}</td>
                      <td>
                        <div className="api-keys-tab__key-row">
                          <code className="api-keys-tab__prefix" title={key.key || undefined}>
                            {key.key || `sk-${key.prefix}…`}
                          </code>
                          {key.key && (
                            <button
                              type="button"
                              className="api-keys-tab__btn api-keys-tab__btn--ghost"
                              onClick={() => handleCopy(key)}
                            >
                              {copiedId === key.id ? 'Copied!' : 'Copy'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td>{formatDate(key.createdAt)}</td>
                      <td>
                        <span className={`api-keys-tab__badge api-keys-tab__badge--${key.status}`}>
                          {key.status}
                        </span>
                      </td>
                      <td>
                        {key.status === 'active' && (
                          <button
                            type="button"
                            className="api-keys-tab__btn api-keys-tab__btn--danger"
                            onClick={() => handleRevoke(key.id)}
                            disabled={revokingId === key.id}
                          >
                            {revokingId === key.id ? 'Revoking…' : 'Revoke'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <GenerateKeyModal
          onClose={() => setShowModal(false)}
          onSuccess={() => loadKeys()}
        />
      )}
    </DashboardLayout>
  );
}
