import { Link } from 'react-router-dom';
import './CTAButton.css';

export function CTAButton({ to, children, variant = 'primary', className = '' }) {
  const classes = ['cta-button', `cta-button--${variant}`, className].filter(Boolean).join(' ');

  return (
    <Link to={to} className={classes}>
      {children}
    </Link>
  );
}
