import { getStoredUser } from '../utils/auth.js';
import './OnboardingStep1.css';

export function OnboardingStep1({ name, onNameChange, onContinue }) {
  const user = getStoredUser();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onContinue(name.trim());
  };

  return (
    <div className="onboarding-step">
      <h2 className="onboarding-step__title">Set your display name</h2>
      <p className="onboarding-step__subtitle">
        This is how you&apos;ll appear across the dashboard{user?.email ? ` (${user.email})` : ''}.
      </p>

      <form className="onboarding-step__form" onSubmit={handleSubmit}>
        <label className="onboarding-step__label" htmlFor="display-name">
          Display name
        </label>
        <input
          id="display-name"
          className="onboarding-step__input"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Jane Doe"
          required
          autoFocus
        />
        <button type="submit" className="onboarding-step__button" disabled={!name.trim()}>
          Continue
        </button>
      </form>
    </div>
  );
}
