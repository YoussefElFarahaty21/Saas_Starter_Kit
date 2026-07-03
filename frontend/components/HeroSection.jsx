import { CTAButton } from './CTAButton.jsx';
import './HeroSection.css';

export function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-section__badge">Production-Ready Boilerplate</div>
      <h1 className="hero-section__headline">
        The SaaS foundation you don&apos;t have to build twice
      </h1>
      <p className="hero-section__subheading">
        Auth, billing, dashboard, and mobile — ready to deploy
      </p>
      <div className="hero-section__actions">
        <CTAButton to="/register" variant="primary">
          Get Started Free
        </CTAButton>
        <CTAButton to="/dashboard" variant="secondary">
          View Demo
        </CTAButton>
      </div>
    </section>
  );
}
