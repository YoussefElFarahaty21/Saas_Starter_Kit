import { useState } from 'react';
import { apiFetch } from '../utils/api.js';
import './OnboardingStep3.css';

export function OnboardingStep3({ onComplete, onSkip }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invite');
      setSuccess(`Invite sent to ${email.trim()}`);
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setError('');
    setCompleting(true);
    try {
      await onSkip();
    } catch (err) {
      setError(err.message);
      setCompleting(false);
    }
  };

  const handleFinish = async () => {
    setError('');
    setCompleting(true);
    try {
      await onComplete();
    } catch (err) {
      setError(err.message);
      setCompleting(false);
    }
  };

  return (
    <div className="onboarding-step">
      <h2 className="onboarding-step__title">Invite a teammate</h2>
      <p className="onboarding-step__subtitle">
        Collaboration is optional — you can always invite people later from settings.
      </p>

      {error && <div className="onboarding-step__error">{error}</div>}
      {success && <div className="onboarding-step__success">{success}</div>}

      <form className="onboarding-step__form" onSubmit={handleInvite}>
        <label className="onboarding-step__label" htmlFor="invite-email">
          Teammate email
        </label>
        <input
          id="invite-email"
          className="onboarding-step__input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@company.com"
        />
        <button type="submit" className="onboarding-step__button" disabled={loading || completing}>
          {loading ? 'Sending…' : 'Send Invite'}
        </button>
      </form>

      <div className="onboarding-step__actions">
        <button
          type="button"
          className="onboarding-step__button"
          onClick={handleFinish}
          disabled={loading || completing}
        >
          {completing ? 'Finishing…' : 'Finish Setup'}
        </button>
        <button
          type="button"
          className="onboarding-step__link-button"
          onClick={handleSkip}
          disabled={loading || completing}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
