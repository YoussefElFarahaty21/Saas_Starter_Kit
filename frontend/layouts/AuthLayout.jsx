import { PageTransition } from '../components/PageTransition.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import './AuthLayout.css';

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-layout">
      <PageTransition className="auth-layout__card">
        <div className="auth-layout__toggle">
          <ThemeToggle />
        </div>
        <div className="auth-layout__header">
          <div className="auth-layout__brand">SaaS Kit</div>
          {title && <h1 className="auth-layout__title">{title}</h1>}
          {subtitle && <p className="auth-layout__subtitle">{subtitle}</p>}
        </div>
        {children}
      </PageTransition>
    </div>
  );
}
