import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout.jsx';
import { WebhookModal } from '../components/WebhookModal.jsx';
import config from '../config.js';
import { getToken, hasPlanAccess } from '../utils/auth.js';
import './IntegrationsTab.css';

export function IntegrationsTab() {
  const isEnterprise = hasPlanAccess('enterprise');

  const [slackUrl, setSlackUrl] = useState('');
  const [slackLoading, setSlackLoading] = useState(true);
  const [slackSaving, setSlackSaving] = useState(false);
  const [slackTesting, setSlackTesting] = useState(false);
  const [slackMsg, setSlackMsg] = useState('');
  const [slackError, setSlackError] = useState('');

  const [webhooks, setWebhooks] = useState([]);
  const [webhooksLoading, setWebhooksLoading] = useState(isEnterprise);
  const [webhooksError, setWebhooksError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const authHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadSlack = useCallback(async () => {
    setSlackError('');
    try {
      const res = await fetch(`${config.api_url}/integrations/slack`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load Slack settings');
      setSlackUrl(data.url || '');
    } catch (err) {
      setSlackError(err.message);
    } finally {
      setSlackLoading(false);
    }
  }, []);

  const loadWebhooks = useCallback(async () => {
    if (!isEnterprise) {
      setWebhooksLoading(false);
      return;
    }

    setWebhooksError('');
    try {
      const res = await fetch(`${config.api_url}/webhooks`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load webhooks');
      setWebhooks(data.webhooks || []);
    } catch (err) {
      setWebhooksError(err.message);
    } finally {
      setWebhooksLoading(false);
    }
  }, [isEnterprise]);

  useEffect(() => {
    loadSlack();
    loadWebhooks();
  }, [loadSlack, loadWebhooks]);

  const handleSaveSlack = async (e) => {
    e.preventDefault();
    setSlackMsg('');
    setSlackError('');
    setSlackSaving(true);
    try {
      const res = await fetch(`${config.api_url}/integrations/slack`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ url: slackUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save Slack webhook');
      setSlackMsg(data.message || 'Slack webhook saved');
      setSlackUrl(data.url || slackUrl);
    } catch (err) {
      setSlackError(err.message);
    } finally {
      setSlackSaving(false);
    }
  };

  const handleTestSlack = async () => {
    setSlackMsg('');
    setSlackError('');
    setSlackTesting(true);
    try {
      const res = await fetch(`${config.api_url}/integrations/slack/test`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send test notification');
      setSlackMsg(data.message || 'Test notification sent');
    } catch (err) {
      setSlackError(err.message);
    } finally {
      setSlackTesting(false);
    }
  };

  const handleToggleWebhook = async (webhookId) => {
    setBusyId(webhookId);
    setWebhooksError('');
    try {
      const res = await fetch(`${config.api_url}/webhooks/${webhookId}/pause`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update webhook');
      await loadWebhooks();
    } catch (err) {
      setWebhooksError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteWebhook = async (webhookId) => {
    if (!window.confirm('Delete this webhook?')) return;

    setBusyId(webhookId);
    setWebhooksError('');
    try {
      const res = await fetch(`${config.api_url}/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete webhook');
      await loadWebhooks();
    } catch (err) {
      setWebhooksError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="integrations-tab">
        <h1 className="integrations-tab__title">Integrations</h1>
        <p className="integrations-tab__subtitle">
          Connect Slack and register outgoing webhooks for account events.
        </p>

        <section className="integrations-tab__card">
          <h2>Slack</h2>
          <p className="integrations-tab__muted">
            Save your Slack incoming webhook URL to receive notifications in your channel.
          </p>

          {slackLoading && <p className="integrations-tab__muted">Loading…</p>}

          {!slackLoading && (
            <form className="integrations-tab__form" onSubmit={handleSaveSlack}>
              {slackError && <div className="integrations-tab__error">{slackError}</div>}
              {slackMsg && <div className="integrations-tab__success">{slackMsg}</div>}

              <label className="integrations-tab__label" htmlFor="slack-url">
                Slack webhook URL
              </label>
              <input
                id="slack-url"
                className="integrations-tab__input"
                type="url"
                value={slackUrl}
                onChange={(e) => setSlackUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                required
              />

              <div className="integrations-tab__actions">
                <button
                  type="button"
                  className="integrations-tab__btn integrations-tab__btn--ghost"
                  onClick={handleTestSlack}
                  disabled={slackTesting || !slackUrl.trim()}
                >
                  {slackTesting ? 'Testing…' : 'Test'}
                </button>
                <button
                  type="submit"
                  className="integrations-tab__btn integrations-tab__btn--primary"
                  disabled={slackSaving}
                >
                  {slackSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="integrations-tab__card">
          <div className="integrations-tab__section-header">
            <div>
              <h2>Outgoing Webhooks</h2>
              <p className="integrations-tab__muted">
                Enterprise only. We POST signed events to your endpoint.
              </p>
            </div>
            {isEnterprise && (
              <button
                type="button"
                className="integrations-tab__btn integrations-tab__btn--primary"
                onClick={() => setShowModal(true)}
              >
                Add Webhook
              </button>
            )}
          </div>

          {!isEnterprise && (
            <div className="integrations-tab__upgrade">
              <p>Upgrade to Enterprise to register outgoing webhooks.</p>
              <Link to="/billing" className="integrations-tab__btn integrations-tab__btn--primary">
                Upgrade Plan
              </Link>
            </div>
          )}

          {isEnterprise && webhooksError && (
            <div className="integrations-tab__error">{webhooksError}</div>
          )}

          {isEnterprise && webhooksLoading && (
            <p className="integrations-tab__muted">Loading webhooks…</p>
          )}

          {isEnterprise && !webhooksLoading && webhooks.length === 0 && (
            <p className="integrations-tab__muted">No webhooks registered yet.</p>
          )}

          {isEnterprise && !webhooksLoading && webhooks.length > 0 && (
            <div className="integrations-tab__table-wrap">
              <table className="integrations-tab__table">
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Events</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map((webhook) => (
                    <tr key={webhook.id}>
                      <td>
                        <code className="integrations-tab__url">{webhook.url}</code>
                      </td>
                      <td>
                        <div className="integrations-tab__events">
                          {(webhook.events || []).map((event) => (
                            <span key={event} className="integrations-tab__chip">
                              {event}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`integrations-tab__badge integrations-tab__badge--${webhook.status}`}>
                          {webhook.status}
                        </span>
                      </td>
                      <td>
                        <div className="integrations-tab__row-actions">
                          <button
                            type="button"
                            className="integrations-tab__btn integrations-tab__btn--ghost"
                            onClick={() => handleToggleWebhook(webhook.id)}
                            disabled={busyId === webhook.id}
                          >
                            {webhook.status === 'active' ? 'Pause' : 'Resume'}
                          </button>
                          <button
                            type="button"
                            className="integrations-tab__btn integrations-tab__btn--danger"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                            disabled={busyId === webhook.id}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <WebhookModal
          onClose={() => setShowModal(false)}
          onSuccess={() => loadWebhooks()}
        />
      )}
    </DashboardLayout>
  );
}
