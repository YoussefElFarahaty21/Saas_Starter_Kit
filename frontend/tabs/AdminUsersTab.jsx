import { useState, useEffect } from 'react';
import { PlanBadge } from '../components/PlanBadge.jsx';
import { SkeletonRow } from '../components/SkeletonRow.jsx';
import { apiFetch } from '../utils/api.js';
import './AdminUsersTab.css';

const PLANS = ['free', 'pro', 'enterprise'];

export function AdminUsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load users');
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setActionMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePlanChange = async (userId, plan) => {
    try {
      const res = await apiFetch(`/admin/users/${userId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, plan } : u)));
      setActionMsg(`Plan updated for ${userId}`);
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const handleSuspend = async (userId, suspend) => {
    try {
      const res = await apiFetch(`/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspend }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newStatus = suspend ? 'suspended' : 'active';
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      setActionMsg(`User ${suspend ? 'suspended' : 'reactivated'}`);
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="admin-users">
      {actionMsg && (
        <div
          className={`admin-users__msg ${
            actionMsg.startsWith('Error') ? 'admin-users__msg--error' : 'admin-users__msg--ok'
          }`}
        >
          {actionMsg}
        </div>
      )}

      <div className="admin-users__toolbar">
        <input
          type="text"
          className="admin-users__search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="admin-users__count">
          {filtered.length} of {users.length} users
        </span>
      </div>

      {loading ? (
        <div className="admin-users__table-wrap">
          <table className="admin-users__table">
            <tbody>
              <SkeletonRow columns={5} />
              <SkeletonRow columns={5} />
              <SkeletonRow columns={5} />
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-users__table-wrap">
          <table className="admin-users__table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="admin-users__name">{user.name}</div>
                    <div className="admin-users__email">{user.email}</div>
                  </td>
                  <td>
                    <PlanBadge plan={user.plan} />
                  </td>
                  <td>
                    <span
                      className={`admin-users__status admin-users__status--${
                        user.status === 'suspended' ? 'suspended' : 'active'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="admin-users__role">{user.role}</td>
                  <td>
                    <div className="admin-users__actions">
                      <select
                        className="admin-users__select"
                        value={user.plan}
                        onChange={(e) => handlePlanChange(user.id, e.target.value)}
                      >
                        {PLANS.map((p) => (
                          <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={`admin-users__btn ${
                          user.status === 'suspended'
                            ? 'admin-users__btn--reactivate'
                            : 'admin-users__btn--suspend'
                        }`}
                        onClick={() => handleSuspend(user.id, user.status !== 'suspended')}
                      >
                        {user.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-users__empty">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
