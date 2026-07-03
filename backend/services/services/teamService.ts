import { randomBytes } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import db from '../../config/firebaseAdmin';
import { getUserByEmail, getUserById } from './userService';

export interface Team {
  id: string;
  ownerId: string;
  name: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'member';
  joinedAt: FirebaseFirestore.Timestamp;
}

export interface Invite {
  id: string;
  teamId: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: FirebaseFirestore.Timestamp;
}

export interface TeamMemberWithUser extends TeamMember {
  name: string;
  email: string;
}

const TEAMS = 'teams';
const TEAM_MEMBERS = 'teamMembers';
const INVITES = 'invites';

export const createTeam = async (ownerId: string, name: string): Promise<Team> => {
  const existing = await getTeamByOwnerId(ownerId);
  if (existing) {
    throw Object.assign(new Error('You already own a team'), { statusCode: 409 });
  }

  const teamRef = db.collection(TEAMS).doc();
  const team = {
    id: teamRef.id,
    ownerId,
    name: name.trim(),
    createdAt: FieldValue.serverTimestamp(),
  };
  await teamRef.set(team);

  const memberRef = db.collection(TEAM_MEMBERS).doc();
  await memberRef.set({
    id: memberRef.id,
    teamId: teamRef.id,
    userId: ownerId,
    role: 'owner',
    joinedAt: FieldValue.serverTimestamp(),
  });

  return {
    ...team,
    createdAt: null as unknown as FirebaseFirestore.Timestamp,
  };
};

export const getTeamByOwnerId = async (ownerId: string): Promise<Team | null> => {
  const snap = await db
    .collection(TEAMS)
    .where('ownerId', '==', ownerId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Team;
};

export const getTeamById = async (teamId: string): Promise<Team | null> => {
  const doc = await db.collection(TEAMS).doc(teamId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Team;
};

/**
 * Returns the team the user owns, or the first team they belong to as a member.
 */
export const getTeamMembershipForUser = async (
  userId: string,
): Promise<{ team: Team; role: 'owner' | 'member' } | null> => {
  const [ownedSnap, memberSnap] = await Promise.all([
    db.collection(TEAMS).where('ownerId', '==', userId).limit(1).get(),
    db.collection(TEAM_MEMBERS).where('userId', '==', userId).limit(1).get(),
  ]);

  if (!ownedSnap.empty) {
    const doc = ownedSnap.docs[0];
    return { team: { id: doc.id, ...doc.data() } as Team, role: 'owner' };
  }

  if (memberSnap.empty) return null;

  const membership = memberSnap.docs[0].data() as TeamMember;
  const team = await getTeamById(membership.teamId);
  if (!team) return null;

  return {
    team,
    role: membership.role === 'owner' ? 'owner' : 'member',
  };
};

export const inviteMember = async (
  teamId: string,
  email: string,
): Promise<{ invite: Invite; token: string }> => {
  const normalizedEmail = email.toLowerCase().trim();
  const team = await getTeamById(teamId);
  if (!team) {
    throw Object.assign(new Error('Team not found'), { statusCode: 404 });
  }

  const existingUser = await getUserByEmail(normalizedEmail);
  if (existingUser) {
    const alreadyMember = await db
      .collection(TEAM_MEMBERS)
      .where('teamId', '==', teamId)
      .where('userId', '==', existingUser.id)
      .limit(1)
      .get();
    if (!alreadyMember.empty) {
      throw Object.assign(new Error('User is already a team member'), { statusCode: 409 });
    }
  }

  const pendingSnap = await db
    .collection(INVITES)
    .where('teamId', '==', teamId)
    .where('email', '==', normalizedEmail)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!pendingSnap.empty) {
    throw Object.assign(new Error('An invite is already pending for this email'), { statusCode: 409 });
  }

  const token = randomBytes(32).toString('hex');
  const inviteRef = db.collection(INVITES).doc();
  const invite = {
    id: inviteRef.id,
    teamId,
    email: normalizedEmail,
    token,
    status: 'pending' as const,
    createdAt: FieldValue.serverTimestamp(),
  };

  await inviteRef.set(invite);

  return {
    invite: {
      ...invite,
      createdAt: null as unknown as FirebaseFirestore.Timestamp,
    },
    token,
  };
};

export const getTeamMembers = async (teamId: string): Promise<TeamMemberWithUser[]> => {
  const snap = await db
    .collection(TEAM_MEMBERS)
    .where('teamId', '==', teamId)
    .get();

  if (snap.empty) return [];

  const memberRows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TeamMember);
  const uniqueUserIds = [...new Set(memberRows.map((m) => m.userId).filter(Boolean))];

  const userDocs =
    uniqueUserIds.length > 0
      ? await db.getAll(...uniqueUserIds.map((id) => db.collection('users').doc(id)))
      : [];

  const usersById = new Map<string, { name?: string; email?: string }>();
  for (const doc of userDocs) {
    if (doc.exists) {
      usersById.set(doc.id, doc.data() as { name?: string; email?: string });
    }
  }

  const members: TeamMemberWithUser[] = memberRows.map((member) => {
    const user = usersById.get(member.userId);
    return {
      ...member,
      name: user?.name || 'Unknown',
      email: user?.email || '',
    };
  });

  members.sort((a, b) => {
    if (a.role === 'owner' && b.role !== 'owner') return -1;
    if (a.role !== 'owner' && b.role === 'owner') return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return members;
};

export const removeMember = async (teamId: string, memberId: string): Promise<void> => {
  const doc = await db.collection(TEAM_MEMBERS).doc(memberId).get();
  if (!doc.exists) {
    throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  }

  const member = doc.data() as TeamMember;
  if (member.teamId !== teamId) {
    throw Object.assign(new Error('Member not found on this team'), { statusCode: 404 });
  }

  if (member.role === 'owner') {
    throw Object.assign(new Error('Cannot remove the team owner'), { statusCode: 400 });
  }

  await db.collection(TEAM_MEMBERS).doc(memberId).delete();
};

export const acceptInvite = async (token: string): Promise<{ teamId: string; email: string }> => {
  const snap = await db
    .collection(INVITES)
    .where('token', '==', token)
    .limit(1)
    .get();

  if (snap.empty) {
    throw Object.assign(new Error('Invalid or expired invite link'), { statusCode: 404 });
  }

  const inviteDoc = snap.docs[0];
  const invite = { id: inviteDoc.id, ...inviteDoc.data() } as Invite;

  if (invite.status !== 'pending') {
    throw Object.assign(new Error('Invalid or expired invite link'), { statusCode: 400 });
  }

  const user = await getUserByEmail(invite.email);
  if (!user) {
    throw Object.assign(new Error('Account required'), {
      statusCode: 404,
      code: 'ACCOUNT_REQUIRED',
      email: invite.email,
    });
  }

  const existing = await db
    .collection(TEAM_MEMBERS)
    .where('teamId', '==', invite.teamId)
    .where('userId', '==', user.id)
    .limit(1)
    .get();

  if (existing.empty) {
    const memberRef = db.collection(TEAM_MEMBERS).doc();
    await memberRef.set({
      id: memberRef.id,
      teamId: invite.teamId,
      userId: user.id,
      role: 'member',
      joinedAt: FieldValue.serverTimestamp(),
    });
  }

  await inviteDoc.ref.update({ status: 'accepted' });

  return { teamId: invite.teamId, email: invite.email };
};
