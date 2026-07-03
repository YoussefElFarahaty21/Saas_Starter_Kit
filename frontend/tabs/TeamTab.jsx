import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout.jsx';
import { SkeletonRow } from '../components/SkeletonRow.jsx';
import { SkeletonCard } from '../components/SkeletonCard.jsx';
import { InviteModal } from '../components/InviteModal.jsx';
import config from '../config.js';
import { getToken, hasPlanAccess } from '../utils/auth.js';
import './TeamTab.css';

const formatDate = (value) => {
  if (!value) return '—';
  try {
    if (value._seconds) return new Date(value._seconds * 1000).toLocaleDateString();
    if (value.seconds) return new Date(value.seconds * 1000).toLocaleDateString();
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
};

export function TeamTab() {
  const canManageTeam = hasPlanAccess('pro');

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamName, setTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const authHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadMembers = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(`${config.api_url}/team/members`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load team');
      setTeam(data.team || null);
      setMembers(data.members || []);
      setIsOwner(Boolean(data.isOwner));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setCreating(true);
    setError('');
    try {
      const res = await fetch(`${config.api_url}/team/create`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: teamName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create team');
      setTeam(data.team);
      setTeamName('');
      await loadMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm('Remove this member from the team?')) return;

    setRemovingId(memberId);
    setError('');
    try {
      const res = await fetch(`${config.api_url}/team/members/${memberId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove member');
      await loadMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="team-tab">
        <div className="team-tab__header">
          <div>
            <h1 className="team-tab__title">Team</h1>
            <p className="team-tab__subtitle">
              {team
                ? isOwner
                  ? team.name
                  : `${team.name} (member)`
                : 'Invite teammates to collaborate on your workspace.'}
            </p>
          </div>
          {team && isOwner && (
            <button
              type="button"
              className="team-tab__btn team-tab__btn--primary"
              onClick={() => setShowInvite(true)}
            >
              Invite Member
            </button>
          )}
        </div>

        {error && <div className="team-tab__error">{error}</div>}

        {loading && (
          <div className="team-tab__card">
            <SkeletonCard />
            <table className="team-tab__table" style={{ marginTop: 16 }}>
              <tbody>
                <SkeletonRow columns={5} />
                <SkeletonRow columns={5} />
                <SkeletonRow columns={5} />
              </tbody>
            </table>
          </div>
        )}

        {!loading && !team && !canManageTeam && (
          <div className="team-tab__upgrade">
            <h2>Team invites are a Pro feature</h2>
            <p>Upgrade to Pro or Enterprise to create a team and invite members by email.</p>
            <Link to="/billing" className="team-tab__btn team-tab__btn--primary">
              Upgrade Plan
            </Link>
          </div>
        )}

        {!loading && !team && canManageTeam && (
          <div className="team-tab__card">
            <h2>Create your team</h2>
            <p className="team-tab__muted">You need a team before you can invite members.</p>
            <form className="team-tab__create-form" onSubmit={handleCreateTeam}>
              <input
                className="team-tab__input"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                required
              />
              <button
                type="submit"
                className="team-tab__btn team-tab__btn--primary"
                disabled={creating || !teamName.trim()}
              >
                {creating ? 'Creating…' : 'Create Team'}
              </button>
            </form>
          </div>
        )}

        {!loading && team && (
          <div className="team-tab__card">
            <h2>Members</h2>
            {!isOwner && (
              <p className="team-tab__muted">
                You are a member of this team. Only the owner can invite or remove people.
              </p>
            )}
            {members.length === 0 ? (
              <p className="team-tab__muted">No members yet.</p>
            ) : (
              <div className="team-tab__table-wrap">
                <table className="team-tab__table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      {isOwner && <th />}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td>{member.name}</td>
                        <td>{member.email}</td>
                        <td>
                          <span className={`team-tab__role team-tab__role--${member.role}`}>
                            {member.role}
                          </span>
                        </td>
                        <td>{formatDate(member.joinedAt)}</td>
                        {isOwner && (
                          <td>
                            {member.role !== 'owner' && (
                              <button
                                type="button"
                                className="team-tab__btn team-tab__btn--danger"
                                onClick={() => handleRemove(member.id)}
                                disabled={removingId === member.id}
                              >
                                {removingId === member.id ? 'Removing…' : 'Remove'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showInvite && isOwner && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => loadMembers()}
        />
      )}
    </DashboardLayout>
  );
}
