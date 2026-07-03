import { Link, useNavigate } from 'react-router-dom';
import { getStoredUser } from '../utils/auth.js';
import { logout } from '../utils/api.js';
import { PlanBadge } from './PlanBadge.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import './Navbar.css';

export function Navbar() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar__brand">
        SaaS Kit
      </Link>

      <div className="navbar__actions">
        <ThemeToggle />
        {user && (
          <>
            <span className="navbar__user">{user.name}</span>
            <PlanBadge plan={user.plan} />
          </>
        )}
        <button type="button" className="navbar__logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
