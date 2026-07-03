import { NavLink } from 'react-router-dom';
import { isAdminUser, hasPlanAccess } from '../utils/auth.js';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/billing', label: 'Billing', icon: '💳' },
  { to: '/team', label: 'Team', icon: '👥' },
  { to: '/keys', label: 'API Keys', icon: '🔑', minPlan: 'pro' },
  { to: '/integrations', label: 'Integrations', icon: '🔌' },
];

const ADMIN_ITEMS = [
  { to: '/admin', label: 'Admin Panel', icon: '🛡' },
];

export function Sidebar() {
  const showAdmin = isAdminUser();

  return (
    <aside className="sidebar">
      {NAV_ITEMS.filter((item) => !item.minPlan || hasPlanAccess(item.minPlan)).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
        >
          <span>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}

      {showAdmin && (
        <>
          <div className="sidebar__section">Admin</div>
          {ADMIN_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </>
      )}
    </aside>
  );
}
