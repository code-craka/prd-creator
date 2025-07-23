import { db } from '../config/database';
import { 
  ErrorFactory
} from '../utils/errorHelpers';
import crypto from 'crypto';
import {
  TeamInvitation,
  MemberActivityLog,
  RoleChangeHistory,
  // Import shared utilities
  hasPermission,
  isValidEmail,
  normalizeEmail,
  isValidRoleChange,
  calculateInvitationExpiry,
  createPermissionErrorMessage,
  createValidationErrorMessage,
  TeamRole,
  MemberAction,
  DEFAULT_INVITATION_EXPIRY_DAYS
} from 'prd-creator-shared';

export class MemberService {
  // Permission checking
  async verifyPermission(teamId: string, userId: string, action: MemberAction): Promise<boolean> {
    const member = await db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .first();

    if (!member) {
      return false;
    }

    return hasPermission(member.role as TeamRole, action);
  }

  // Enhanced invitation system
  async createInvitation(
    teamId: string, 
    inviterId: string, 
    email: string, 
    role: TeamRole = 'member',
    message?: string
  ): Promise<TeamInvitation> {
    // Verify permissions
    if (!await this.verifyPermission(teamId, inviterId, 'invite')) {
      throw ErrorFactory.forbidden(createPermissionErrorMessage('invite'));
    }

    if (!isValidEmail(email)) {
      throw ErrorFactory.validation(createValidationErrorMessage('email', email));
    }

    const normalizedEmailAddr = normalizeEmail(email);

    // Check if already a member
    const existingUser = await db('users').where('email', normalizedEmailAddr).first();
    if (existingUser) {
      const existingMember = await db('team_members')
        .where({ team_id: teamId, user_id: existingUser.id })
        .first();
      
      if (existingMember) {
        throw ErrorFactory.conflict('User is already a team member');
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await db('team_invitations')
      .where({ 
        team_id: teamId, 
        email: normalizedEmailAddr, 
        status: 'pending' 
      })
      .first();

    if (existingInvitation) {
      throw ErrorFactory.conflict('Pending invitation already exists for this email');
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = calculateInvitationExpiry(DEFAULT_INVITATION_EXPIRY_DAYS);

    const [invitation] = await db('team_invitations').insert({
      team_id: teamId,
      email: normalizedEmailAddr,
      role,
      invited_by: inviterId,
      token,
      expires_at: expiresAt,
      message,
      status: 'pending'
    }).returning('*');

    // Log activity
    await this.logActivity(teamId, inviterId, 'invitation_sent', {
      email: normalizedEmailAddr,
      role,
      message
    });

    return invitation;
  }

  async getTeamInvitations(teamId: string, userId: string): Promise<TeamInvitation[]> {
    if (!await this.verifyPermission(teamId, userId, 'manage_invitations')) {
      throw ErrorFactory.forbidden('You do not have permission to view invitations');
    }

    return db('team_invitations')
      .leftJoin('users as inviter', 'team_invitations.invited_by', 'inviter.id')
      .where('team_invitations.team_id', teamId)
      .select([
        'team_invitations.*',
        'inviter.name as invited_by_name',
        'inviter.email as invited_by_email'
      ])
      .orderBy('team_invitations.created_at', 'desc');
  }

  async resendInvitation(teamId: string, userId: string, invitationId: string): Promise<void> {
    if (!await this.verifyPermission(teamId, userId, 'manage_invitations')) {
      throw ErrorFactory.forbidden(createPermissionErrorMessage('manage_invitations'));
    }

    const invitation = await db('team_invitations')
      .where({ id: invitationId, team_id: teamId })
      .first();

    if (!invitation) {
      throw ErrorFactory.notFound('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw ErrorFactory.validation('Can only resend pending invitations');
    }

    // Update expiry and generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = calculateInvitationExpiry(DEFAULT_INVITATION_EXPIRY_DAYS);

    await db('team_invitations')
      .where('id', invitationId)
      .update({
        token,
        expires_at: expiresAt,
        updated_at: db.fn.now()
      });

    // Log activity
    await this.logActivity(teamId, userId, 'invitation_resent', {
      email: invitation.email,
      invitation_id: invitationId
    });
  }

  async cancelInvitation(teamId: string, userId: string, invitationId: string): Promise<void> {
    if (!await this.verifyPermission(teamId, userId, 'manage_invitations')) {
      throw ErrorFactory.forbidden(createPermissionErrorMessage('manage_invitations'));
    }

    const invitation = await db('team_invitations')
      .where({ id: invitationId, team_id: teamId })
      .first();

    if (!invitation) {
      throw ErrorFactory.notFound('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw ErrorFactory.validation('Can only cancel pending invitations');
    }

    await db('team_invitations')
      .where('id', invitationId)
      .update({
        status: 'cancelled',
        cancelled_at: db.fn.now(),
        updated_at: db.fn.now()
      });

    // Log activity
    await this.logActivity(teamId, userId, 'invitation_cancelled', {
      email: invitation.email,
      invitation_id: invitationId
    });
  }

  // Enhanced member management
  async updateMemberRole(
    teamId: string, 
    adminId: string, 
    memberId: string, 
    newRole: TeamRole,
    reason?: string
  ): Promise<void> {
    if (!await this.verifyPermission(teamId, adminId, 'change_role')) {
      throw ErrorFactory.forbidden(createPermissionErrorMessage('change_role'));
    }

    // Get current member
    const member = await db('team_members')
      .where({ team_id: teamId, user_id: memberId })
      .first();

    if (!member) {
      throw ErrorFactory.notFound('Team member not found');
    }

    // Can't change your own role
    if (adminId === memberId) {
      throw ErrorFactory.forbidden('Cannot change your own role');
    }

    // Validate role change using shared logic
    if (!isValidRoleChange(member.role, newRole, 'owner')) {
      throw ErrorFactory.forbidden('Invalid role change');
    }

    // Set current user context for triggers
    await db.raw('SET LOCAL app.current_user_id = ?', [adminId]);

    await db.transaction(async (trx) => {
      // Update role
      await trx('team_members')
        .where({ team_id: teamId, user_id: memberId })
        .update({ role: newRole });

      // Log in role change history (handled by trigger, but we can add reason)
      if (reason) {
        await trx('role_change_history')
          .where({ 
            team_id: teamId, 
            user_id: memberId,
            changed_by: adminId
          })
          .orderBy('changed_at', 'desc')
          .limit(1)
          .update({ reason });
      }
    });
  }

  async removeMember(teamId: string, adminId: string, memberId: string, reason?: string): Promise<void> {
    if (!await this.verifyPermission(teamId, adminId, 'remove')) {
      throw ErrorFactory.forbidden('You do not have permission to remove members');
    }

    const member = await db('team_members')
      .where({ team_id: teamId, user_id: memberId })
      .first();

    if (!member) {
      throw ErrorFactory.notFound('Team member not found');
    }

    // Can't remove yourself
    if (adminId === memberId) {
      throw ErrorFactory.forbidden('Cannot remove yourself from the team');
    }

    // Can't remove owner
    if (member.role === 'owner') {
      throw ErrorFactory.forbidden('Cannot remove team owner');
    }

    const adminMember = await db('team_members')
      .where({ team_id: teamId, user_id: adminId })
      .first();

    // Only owners can remove admins
    if (member.role === 'admin' && adminMember?.role !== 'owner') {
      throw ErrorFactory.forbidden('Only owners can remove admins');
    }

    await db.transaction(async (trx) => {
      // Mark as inactive instead of deleting (for data integrity)
      await trx('team_members')
        .where({ team_id: teamId, user_id: memberId })
        .update({
          is_active: false,
          deactivated_at: trx.fn.now(),
          deactivated_by: adminId
        });

      // If this was their current team, switch to another team or null
      const user = await trx('users').where('id', memberId).first();
      if (user && user.current_team_id === teamId) {
        const otherTeam = await trx('team_members')
          .join('teams', 'team_members.team_id', 'teams.id')
          .where({ 
            'team_members.user_id': memberId,
            'team_members.is_active': true
          })
          .where('team_members.team_id', '!=', teamId)
          .select('teams.id')
          .first();

        await trx('users')
          .where('id', memberId)
          .update({ current_team_id: otherTeam?.id || null });
      }
    });

    // Log activity
    await this.logActivity(teamId, adminId, 'member_removed', {
      removed_user_id: memberId,
      reason
    });
  }

  // Activity tracking
  async logActivity(
    teamId: string, 
    userId: string, 
    action: string, 
    metadata?: any,
    targetResourceId?: string,
    targetResourceType?: string
  ): Promise<void> {
    await db('member_activity_logs').insert({
      team_id: teamId,
      user_id: userId,
      action,
      metadata: metadata ? JSON.stringify(metadata) : null,
      target_resource_id: targetResourceId,
      target_resource_type: targetResourceType
    });

    // Update member's last active timestamp
    await db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .update({ last_active_at: db.fn.now() });
  }

  async getMemberActivity(teamId: string, userId: string, limit = 50): Promise<MemberActivityLog[]> {
    const member = await db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .first();

    if (!member) {
      throw ErrorFactory.forbidden('Not a team member');
    }

    return db('member_activity_logs')
      .leftJoin('users', 'member_activity_logs.user_id', 'users.id')
      .where('member_activity_logs.team_id', teamId)
      .select([
        'member_activity_logs.*',
        'users.name as user_name',
        'users.email as user_email'
      ])
      .orderBy('member_activity_logs.created_at', 'desc')
      .limit(limit);
  }

  async getRoleChangeHistory(teamId: string, userId: string): Promise<RoleChangeHistory[]> {
    const member = await db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .first();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw ErrorFactory.forbidden('Insufficient permissions to view role change history');
    }

    return db('role_change_history')
      .leftJoin('users as target_user', 'role_change_history.user_id', 'target_user.id')
      .leftJoin('users as changed_by_user', 'role_change_history.changed_by', 'changed_by_user.id')
      .where('role_change_history.team_id', teamId)
      .select([
        'role_change_history.*',
        'target_user.name as user_name',
        'changed_by_user.name as changed_by_name'
      ])
      .orderBy('role_change_history.changed_at', 'desc');
  }

  // Enhanced member listing with activity data
  async getTeamMembersWithActivity(teamId: string, userId: string): Promise<any[]> {
    const member = await db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .first();

    if (!member) {
      throw ErrorFactory.forbidden('Not a team member');
    }

    return db('team_members')
      .leftJoin('users', 'team_members.user_id', 'users.id')
      .leftJoin('users as invited_by_user', 'team_members.invited_by', 'invited_by_user.id')
      .where({
        'team_members.team_id': teamId,
        'team_members.is_active': true
      })
      .select([
        'team_members.*',
        'users.name',
        'users.email',
        'users.avatar_url',
        'invited_by_user.name as invited_by_name'
      ])
      .orderBy([
        { column: 'team_members.role', order: 'asc' }, // owner first, then admin, then member
        { column: 'team_members.joined_at', order: 'asc' }
      ]);
  }

  // Accept invitation (for when users click invitation links)
  async acceptInvitation(token: string, userId: string): Promise<{ teamId: string }> {
    const invitation = await db('team_invitations')
      .where({ token, status: 'pending' })
      .first();

    if (!invitation) {
      throw ErrorFactory.notFound('Invalid or expired invitation');
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await db('team_invitations')
        .where('id', invitation.id)
        .update({ status: 'expired' });
      throw ErrorFactory.validation('Invitation has expired');
    }

    // Check if user email matches invitation
    const user = await db('users').where('id', userId).first();
    if (!user || user.email !== invitation.email) {
      throw ErrorFactory.forbidden('This invitation is not for your email address');
    }

    // Check if already a member
    const existingMember = await db('team_members')
      .where({ team_id: invitation.team_id, user_id: userId })
      .first();

    if (existingMember) {
      throw ErrorFactory.conflict('You are already a member of this team');
    }

    await db.transaction(async (trx) => {
      // Add as team member
      await trx('team_members').insert({
        team_id: invitation.team_id,
        user_id: userId,
        role: invitation.role,
        invited_by: invitation.invited_by,
        joined_at: trx.fn.now()
      });

      // Update invitation status
      await trx('team_invitations')
        .where('id', invitation.id)
        .update({
          status: 'accepted',
          accepted_at: trx.fn.now()
        });
    });

    return { teamId: invitation.team_id };
  }
}

export const memberService = new MemberService();