import './StepIndicator.css';

export function StepIndicator({ currentStep, totalSteps = 3 }) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="step-indicator">
      <p className="step-indicator__label">
        Step {currentStep} of {totalSteps}
      </p>
      <div className="step-indicator__track" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
        <div className="step-indicator__fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
