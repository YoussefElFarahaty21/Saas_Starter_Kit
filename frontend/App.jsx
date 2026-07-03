import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, hasPlanAccess, isAdminUser, needsOnboarding } from './utils/auth.js';

// Pages
import { Landing } from './pages/Landing.jsx';
import { Onboarding } from './pages/Onboarding.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';

// Tabs rendered as pages (each wraps its own layout)
import { ProfileTab } from './tabs/ProfileTab.jsx';
import { BillingTab } from './tabs/BillingTab.jsx';
import { TeamTab } from './tabs/TeamTab.jsx';
import { ApiKeysTab } from './tabs/ApiKeysTab.jsx';
import { IntegrationsTab } from './tabs/IntegrationsTab.jsx';
import { AcceptInvite } from './pages/AcceptInvite.jsx';

/**
 * Guards a route — redirects to /login if no valid JWT exists.
 */
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (needsOnboarding()) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

/**
 * Onboarding route — authenticated users who haven't completed setup.
 */
function OnboardingRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!needsOnboarding()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

/**
 * Guards a route by subscription plan level.
 * Redirects to /billing if the user's plan is below the required level.
 */
function PlanRoute({ children, requiredPlan }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (needsOnboarding()) {
    return <Navigate to="/onboarding" replace />;
  }
  if (!hasPlanAccess(requiredPlan)) {
    return <Navigate to="/billing" replace />;
  }
  return children;
}

/**
 * Guards admin routes — requires admin role + enterprise plan (matches backend).
 */
function AdminRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (needsOnboarding()) {
    return <Navigate to="/onboarding" replace />;
  }
  if (!isAdminUser()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/invite/accept" element={<AcceptInvite />} />

        <Route
          path="/onboarding"
          element={
            <OnboardingRoute>
              <Onboarding />
            </OnboardingRoute>
          }
        />

        {/* Protected routes (any authenticated user) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileTab />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingTab />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <TeamTab />
            </ProtectedRoute>
          }
        />
        <Route
          path="/keys"
          element={
            <PlanRoute requiredPlan="pro">
              <ApiKeysTab />
            </PlanRoute>
          }
        />
        <Route
          path="/integrations"
          element={
            <ProtectedRoute>
              <IntegrationsTab />
            </ProtectedRoute>
          }
        />

        {/* Pro-only example route */}
        <Route
          path="/api-explorer"
          element={
            <PlanRoute requiredPlan="pro">
              <Dashboard />
            </PlanRoute>
          }
        />

        {/* Admin routes (admin role + enterprise plan) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
