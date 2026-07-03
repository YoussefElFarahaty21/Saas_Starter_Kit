import { AdminLayout } from '../layouts/AdminLayout.jsx';
import { AdminUsersTab } from '../tabs/AdminUsersTab.jsx';

export function AdminDashboard() {
  return (
    <AdminLayout>
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>
        User Management
      </h1>
      <AdminUsersTab />
    </AdminLayout>
  );
}
