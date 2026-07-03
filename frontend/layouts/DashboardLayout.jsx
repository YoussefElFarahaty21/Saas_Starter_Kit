import { useLocation } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition.jsx';
import { Navbar } from '../components/Navbar.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import './DashboardLayout.css';

export function DashboardLayout({ children }) {
  const location = useLocation();

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-layout__body">
        <Sidebar />
        <main className="dashboard-layout__main">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
