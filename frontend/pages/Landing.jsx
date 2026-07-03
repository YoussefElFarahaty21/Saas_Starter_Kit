import { LandingLayout } from '../layouts/LandingLayout.jsx';
import { PageTransition } from '../components/PageTransition.jsx';
import { HeroSection } from '../components/HeroSection.jsx';
import { FeaturesGrid } from '../components/FeaturesGrid.jsx';
import { PricingTable } from '../components/PricingTable.jsx';
import { TestimonialsSection } from '../components/TestimonialsSection.jsx';
import { CTAButton } from '../components/CTAButton.jsx';
import './Landing.css';

export function Landing() {
  return (
    <LandingLayout>
      <PageTransition>
        <HeroSection />
        <FeaturesGrid />
        <PricingTable />
        <TestimonialsSection />
        <section className="landing-cta">
          <h2 className="landing-cta__title">Ready to Ship?</h2>
          <p className="landing-cta__text">
            Join developers building with SaaS Kit — auth, billing, and dashboard included.
          </p>
          <CTAButton to="/register" variant="secondary">
            Get Started Free
          </CTAButton>
        </section>
      </PageTransition>
    </LandingLayout>
  );
}
