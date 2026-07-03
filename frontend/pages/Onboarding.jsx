import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StepIndicator } from '../components/StepIndicator.jsx';
import { OnboardingStep1 } from '../components/OnboardingStep1.jsx';
import { OnboardingStep2 } from '../components/OnboardingStep2.jsx';
import { OnboardingStep3 } from '../components/OnboardingStep3.jsx';
import { PageTransition } from '../components/PageTransition.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { getStoredUser, setStoredUser, toStoredUser } from '../utils/auth.js';
import { apiFetch, syncUserSession } from '../utils/api.js';
import './Onboarding.css';

const DRAFT_KEY = 'saas_onboarding_draft';

const loadDraft = () => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveDraft = (draft) => {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
};

const clearDraft = () => {
  sessionStorage.removeItem(DRAFT_KEY);
};

export function Onboarding() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = getStoredUser();
  const draft = loadDraft();

  const [step, setStep] = useState(() => {
    const urlStep = Number(searchParams.get('step'));
    return urlStep >= 1 && urlStep <= 3 ? urlStep : draft?.step || 1;
  });
  const [name, setName] = useState(draft?.name || user?.name || '');
  const [plan, setPlan] = useState(draft?.plan || user?.plan || 'free');
  const [banner, setBanner] = useState('');

  const persistDraft = useCallback((updates) => {
    const current = loadDraft() || {};
    saveDraft({ ...current, ...updates });
  }, []);

  useEffect(() => {
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');

    if (success === 'true') {
      setBanner('Payment successful! Your plan has been updated.');
      setSearchParams({}, { replace: true });
      syncUserSession().then((synced) => {
        if (synced?.plan) setPlan(synced.plan);
        setStep(3);
        persistDraft({ step: 3, plan: synced?.plan || plan });
      });
    } else if (cancelled === 'true') {
      setBanner('Checkout was cancelled. You can pick a plan again or continue with Free.');
      setSearchParams({}, { replace: true });
      setStep(2);
      persistDraft({ step: 2 });
    }
  }, [searchParams, setSearchParams, persistDraft, plan]);

  const completeOnboarding = async () => {
    const res = await apiFetch('/user/onboarding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        plan,
        onboardingComplete: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to complete onboarding');

    setStoredUser(toStoredUser(data.user));
    clearDraft();
    navigate('/dashboard', { replace: true });
  };

  const goToStep = (nextStep, updates = {}) => {
    setStep(nextStep);
    persistDraft({ step: nextStep, name, plan, ...updates });
  };

  return (
    <div className="onboarding-page">
      <PageTransition className="onboarding-card">
        <div className="onboarding-card__top">
          <div className="onboarding-card__brand">SaaS Kit</div>
          <ThemeToggle />
        </div>
        <StepIndicator currentStep={step} />
        {banner && <div className="onboarding-banner">{banner}</div>}

        {step === 1 && (
          <OnboardingStep1
            name={name}
            onNameChange={setName}
            onContinue={(value) => {
              setName(value);
              goToStep(2, { name: value });
            }}
          />
        )}

        {step === 2 && (
          <OnboardingStep2
            selectedPlan={plan}
            onPlanSelect={setPlan}
            onContinue={(selectedPlan) => {
              setPlan(selectedPlan);
              goToStep(3, { plan: selectedPlan });
            }}
          />
        )}

        {step === 3 && (
          <OnboardingStep3
            onComplete={completeOnboarding}
            onSkip={completeOnboarding}
          />
        )}
      </PageTransition>
    </div>
  );
}
