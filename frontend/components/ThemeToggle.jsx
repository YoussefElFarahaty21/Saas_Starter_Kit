import { useTheme } from '../context/ThemeContext.jsx';
import './ThemeToggle.css';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        <span className="theme-toggle__icon" aria-hidden="true">☀️</span>
      ) : (
        <span className="theme-toggle__icon" aria-hidden="true">🌙</span>
      )}
    </button>
  );
}
