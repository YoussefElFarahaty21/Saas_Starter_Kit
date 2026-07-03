import { Request, Response } from 'express';
import {
  createTeam as createTeamService,
  inviteMember as inviteMemberService,
  getTeamMembers,
  removeMember as removeMemberService,
  acceptInvite as acceptInviteService,
  getTeamByOwnerId,
  getTeamMembershipForUser,
} from '../../services/services/teamService';
import { sendInviteEmail } from '../../services/services/emailService';
import { dispatchWebhook } from '../../services/services/webhookService';
import { notifyUserSlack } from '../../services/services/slackService';

const getErrorStatus = (err: unknown): number => {
  if (err && typeof err === 'object' && 'statusCode' in err) {
    return (err as { statusCode: number }).statusCode;
  }
  return 500;
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export const createTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body as { name?: string };

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Team name is required' });
      return;
    }

    const team = await createTeamService(req.user!.userId, name);
    res.status(201).json({ team });
  } catch (err) {
    console.error('[createTeam]', err);
    res.status(getErrorStatus(err)).json({ error: getErrorMessage(err, 'Failed to create team') });
  }
};

export const inviteMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };

    if (!email || !email.trim()) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    const membership = await getTeamMembershipForUser(req.user!.userId);
    if (membership && membership.role !== 'owner') {
      res.status(403).json({ error: 'Only the team owner can invite members' });
      return;
    }

    let team = membership?.team ?? (await getTeamByOwnerId(req.user!.userId));
    if (!team) {
      team = await createTeamService(req.user!.userId, 'My Team');
    }

    const { invite, token } = await inviteMemberService(team.id, email);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteLink = `${clientUrl}/invite/accept?token=${token}`;

    await sendInviteEmail(invite.email, inviteLink).catch((emailErr) => {
      console.error('[Email] Failed to send invite email', emailErr);
    });

    await dispatchWebhook(req.user!.userId, 'member.invited', {
      email: invite.email,
      teamId: invite.teamId,
      inviteId: invite.id,
    }).catch((err) => {
      console.error('[Webhook] Failed to dispatch member.invited', err);
    });

    await notifyUserSlack(
      req.user!.userId,
      `👥 Team invite sent to ${invite.email}`,
    ).catch((err) => {
      console.error('[Slack] Failed to notify user Slack', err);
    });

    res.status(201).json({
      message: 'Invite sent successfully',
      invite: {
        id: invite.id,
        email: invite.email,
        status: invite.status,
        teamId: invite.teamId,
      },
    });
  } catch (err) {
    console.error('[inviteMember]', err);
    res.status(getErrorStatus(err)).json({ error: getErrorMessage(err, 'Failed to send invite') });
  }
};

export const getMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const membership = await getTeamMembershipForUser(req.user!.userId);
    if (!membership) {
      res.json({ team: null, members: [], role: null, isOwner: false });
      return;
    }

    const members = await getTeamMembers(membership.team.id);
    res.json({
      team: membership.team,
      members,
      role: membership.role,
      isOwner: membership.role === 'owner',
    });
  } catch (err) {
    console.error('[getMembers]', err);
    res.status(getErrorStatus(err)).json({ error: getErrorMessage(err, 'Failed to fetch members') });
  }
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      res.status(400).json({ error: 'Member ID is required' });
      return;
    }

    const membership = await getTeamMembershipForUser(req.user!.userId);
    if (!membership || membership.role !== 'owner') {
      res.status(403).json({ error: 'Only the team owner can remove members' });
      return;
    }

    await removeMemberService(membership.team.id, memberId);
    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error('[removeMember]', err);
    res.status(getErrorStatus(err)).json({ error: getErrorMessage(err, 'Failed to remove member') });
  }
};

export const acceptInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : '';

    if (!token) {
      res.status(400).json({ error: 'Invite token is required' });
      return;
    }

    const result = await acceptInviteService(token);
    res.json({
      message: 'You joined the team!',
      teamId: result.teamId,
      email: result.email,
    });
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? (err as { code?: string }).code
        : undefined;
    const email =
      err && typeof err === 'object' && 'email' in err
        ? (err as { email?: string }).email
        : undefined;

    if (code === 'ACCOUNT_REQUIRED') {
      res.status(404).json({
        code: 'ACCOUNT_REQUIRED',
        email,
        token: typeof req.query.token === 'string' ? req.query.token : '',
        error: 'Account required',
      });
      return;
    }

    console.error('[acceptInvite]', err);
    res.status(getErrorStatus(err)).json({
      error: getErrorMessage(err, 'Invalid or expired invite link'),
    });
  }
};
