import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import './LandingLayout.css';

export function LandingLayout({ children }) {
  return (
    <div className="landing-layout">
      <header className="landing-header">
        <Link to="/" className="landing-logo">
          SaaS Kit
        </Link>
        <nav className="landing-nav">
          <ThemeToggle />
          <Link to="/login" className="landing-nav__link landing-nav__link--ghost">
            Login
          </Link>
          <Link to="/register" className="landing-nav__link landing-nav__link--primary">
            Get Started
          </Link>
        </nav>
      </header>

      <main className="landing-main">{children}</main>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} SaaS Starter Kit. All rights reserved.</p>
      </footer>
    </div>
  );
}
