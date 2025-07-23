import { db } from '../config/database';
import { generateSlug, isValidEmail } from '../utils/helpers';
import { 
  ErrorFactory,
  ValidationHelpers
} from '../utils/errorHelpers';
import { teamDb } from '../utils/dbHelpers';
import { Team, TeamMember, CreateTeamRequest } from 'prd-creator-shared';

export class TeamService {
  async createTeam(ownerId: string, data: CreateTeamRequest): Promise<Team> {
    // Validate input using utility helpers
    ValidationHelpers.validateRequired(data.name?.trim(), 'Team name');
    
    const teamName = data.name!.trim();
    if (teamName.length < 2) {
      throw ErrorFactory.validation('Team name must be at least 2 characters long');
    }

    const slug = await this.generateUniqueSlug(teamName);

    // Start transaction
    return db.transaction(async (trx) => {
      // Create team using dbHelper
      const [team] = await trx('teams').insert({
        name: teamName,
        slug,
        owner_id: ownerId,
      }).returning('*');

      // Add owner as team member
      await trx('team_members').insert({
        team_id: team.id,
        user_id: ownerId,
        role: 'owner',
        joined_at: trx.fn.now(),
      });

      // Update user's current team
      await trx('users')
        .where('id', ownerId)
        .update({ current_team_id: team.id });

      return team;
    });
  }

  async getUserTeams(userId: string): Promise<(Team & { role: string })[]> {
    return db('teams')
      .join('team_members', 'teams.id', 'team_members.team_id')
      .where('team_members.user_id', userId)
      .select([
        'teams.*',
        'team_members.role'
      ])
      .orderBy('teams.created_at', 'desc');
  }

  async getTeam(teamId: string, userId: string): Promise<Team> {
    // Verify user is a team member
    await this.verifyTeamMembership(teamId, userId);

    const team = await db('teams')
      .where('id', teamId)
      .first();

    if (!team) {
      throw ErrorFactory.teamNotFound();
    }

    return team;
  }

  async updateTeam(teamId: string, userId: string, updates: Partial<{ name: string; description: string; avatar_url: string }>): Promise<Team> {
    // Verify user has admin permissions
    await this.verifyTeamPermission(teamId, userId, ['owner', 'admin']);

    // Validate updates
    if (updates.name && updates.name.trim().length < 2) {
      throw ErrorFactory.validation('Team name must be at least 2 characters long');
    }

    const cleanUpdates: any = {};
    if (updates.name) {
      cleanUpdates.name = updates.name.trim();
      cleanUpdates.slug = await this.generateUniqueSlug(updates.name.trim());
    }
    if (updates.description !== undefined) {
      cleanUpdates.description = updates.description?.trim() || null;
    }
    if (updates.avatar_url !== undefined) {
      cleanUpdates.avatar_url = updates.avatar_url || null;
    }

    if (Object.keys(cleanUpdates).length === 0) {
      throw ErrorFactory.validation('No valid updates provided');
    }

    const [team] = await db('teams')
      .where('id', teamId)
      .update(cleanUpdates)
      .returning('*');

    if (!team) {
      throw ErrorFactory.notFound('Team not found');
    }

    return team;
  }

  async inviteMember(teamId: string, inviterId: string, email: string): Promise<void> {
    // Verify inviter has permission to invite
    await this.verifyTeamPermission(teamId, inviterId, ['owner', 'admin']);

    if (!isValidEmail(email)) {
      throw ErrorFactory.validation('Invalid email address');
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const invitee = await db('users')
      .where('email', normalizedEmail)
      .first();

    if (!invitee) {
      // TODO: Send invitation email to non-user
      // For now, we'll throw an error
      throw ErrorFactory.notFound('User with this email does not exist. Email invitations will be implemented later.');
    }

    // Check if already a member
    const existingMember = await db('team_members')
      .where({ team_id: teamId, user_id: invitee.id })
      .first();

    if (existingMember) {
      throw ErrorFactory.conflict('User is already a team member');
    }

    // Add as team member
    await db('team_members').insert({
      team_id: teamId,
      user_id: invitee.id,
      role: 'member',
      invited_by: inviterId,
      joined_at: db.fn.now(),
    });

    // TODO: Send welcome email
    // TODO: Track analytics
  }

  async getTeamMembers(teamId: string, userId: string): Promise<TeamMember[]> {
    await this.verifyTeamMembership(teamId, userId);

    return db('team_members')
      .join('users', 'team_members.user_id', 'users.id')
      .where('team_members.team_id', teamId)
      .select([
        'team_members.*',
        'users.name',
        'users.email',
        'users.avatar_url'
      ])
      .orderBy('team_members.created_at', 'asc');
  }

  async updateMemberRole(teamId: string, adminId: string, memberId: string, role: 'owner' | 'admin' | 'member'): Promise<void> {
    // Verify admin has permission
    const adminMember = await this.verifyTeamPermission(teamId, adminId, ['owner']);

    // Get the member to update
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

    // Only owners can assign owner role
    if (role === 'owner' && adminMember.role !== 'owner') {
      throw ErrorFactory.forbidden('Only owners can assign owner role');
    }

    await db.transaction(async (trx) => {
      // Update member role
      await trx('team_members')
        .where({ team_id: teamId, user_id: memberId })
        .update({ role });

      // If promoting to owner, demote current owner to admin
      if (role === 'owner') {
        await trx('team_members')
          .where({ team_id: teamId, user_id: adminId })
          .update({ role: 'admin' });

        // Update team owner
        await trx('teams')
          .where('id', teamId)
          .update({ owner_id: memberId });
      }
    });
  }

  async removeMember(teamId: string, adminId: string, memberId: string): Promise<void> {
    // Verify admin has permission
    await this.verifyTeamPermission(teamId, adminId, ['owner', 'admin']);

    // Get the member to remove
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

    // Only owners can remove admins
    const adminMember = await db('team_members')
      .where({ team_id: teamId, user_id: adminId })
      .first();

    if (member.role === 'admin' && adminMember?.role !== 'owner') {
      throw ErrorFactory.forbidden('Only owners can remove admins');
    }

    await db.transaction(async (trx) => {
      // Remove from team
      await trx('team_members')
        .where({ team_id: teamId, user_id: memberId })
        .del();

      // If this was their current team, switch to another team or null
      const user = await trx('users')
        .where('id', memberId)
        .first();

      if (user && user.current_team_id === teamId) {
        const otherTeam = await trx('team_members')
          .join('teams', 'team_members.team_id', 'teams.id')
          .where('team_members.user_id', memberId)
          .select('teams.id')
          .first();

        await trx('users')
          .where('id', memberId)
          .update({ current_team_id: otherTeam?.id || null });
      }
    });
  }

  async switchTeam(userId: string, teamId: string): Promise<Team> {
    // Verify user is a member of the team
    await this.verifyTeamMembership(teamId, userId);

    // Update user's current team
    await db('users')
      .where('id', userId)
      .update({ current_team_id: teamId });

    // Get team details
    const team = await db('teams')
      .where('id', teamId)
      .first();

    if (!team) {
      throw ErrorFactory.notFound('Team not found');
    }

    return team;
  }

  async getTeamSettings(teamId: string, userId: string): Promise<any> {
    // Verify user is a team member
    await this.verifyTeamMembership(teamId, userId);

    const team = await db('teams')
      .where('id', teamId)
      .first();

    if (!team) {
      throw ErrorFactory.notFound('Team not found');
    }

    // Get owner information
    const owner = await db('users')
      .where('id', team.owner_id)
      .select('name', 'email')
      .first();

    // Get member count
    const memberCountResult = await db('team_members')
      .where('team_id', teamId)
      .count('* as count')
      .first();

    return {
      team,
      memberCount: parseInt(memberCountResult?.count as string) || 0,
      ownerName: owner?.name || owner?.email || 'Unknown',
      createdAt: team.created_at
    };
  }

  async transferOwnership(teamId: string, currentOwnerId: string, newOwnerId: string, reason?: string): Promise<void> {
    // Verify current user is the owner
    await this.verifyTeamPermission(teamId, currentOwnerId, ['owner']);

    // Verify new owner is a team member
    const newOwnerMember = await db('team_members')
      .where({ team_id: teamId, user_id: newOwnerId })
      .first();

    if (!newOwnerMember) {
      throw ErrorFactory.validation('New owner must be a team member');
    }

    if (currentOwnerId === newOwnerId) {
      throw ErrorFactory.validation('Cannot transfer ownership to yourself');
    }

    await db.transaction(async (trx) => {
      // Update team owner
      await trx('teams')
        .where('id', teamId)
        .update({ owner_id: newOwnerId });

      // Update roles
      await trx('team_members')
        .where({ team_id: teamId, user_id: newOwnerId })
        .update({ role: 'owner' });

      await trx('team_members')
        .where({ team_id: teamId, user_id: currentOwnerId })
        .update({ role: 'admin' });

      // Log the ownership transfer (if activity logging exists)
      try {
        await trx('member_activity_logs').insert({
          team_id: teamId,
          user_id: currentOwnerId,
          action: 'ownership_transferred',
          metadata: JSON.stringify({
            new_owner_id: newOwnerId,
            reason: reason || 'Ownership transfer'
          }),
          target_resource_type: 'team',
          target_resource_id: teamId
        });
      } catch (err) {
        // Log activity table might not exist yet, continue without error
      }
    });
  }

  async deleteTeam(teamId: string, userId: string, reason?: string): Promise<void> {
    // Verify user is the owner
    await this.verifyTeamPermission(teamId, userId, ['owner']);

    // Get team info for logging
    const team = await db('teams').where('id', teamId).first();
    
    if (!team) {
      throw ErrorFactory.notFound('Team not found');
    }

    await db.transaction(async (trx) => {
      // Log the deletion before removing everything
      try {
        await trx('member_activity_logs').insert({
          team_id: teamId,
          user_id: userId,
          action: 'team_deleted',
          metadata: JSON.stringify({
            team_name: team.name,
            reason: reason || 'Team deletion'
          }),
          target_resource_type: 'team',
          target_resource_id: teamId
        });
      } catch (err) {
        // Log activity table might not exist yet, continue without error
      }

      // Update users who have this as current team
      await trx('users')
        .where('current_team_id', teamId)
        .update({ current_team_id: null });

      // Delete all related data in correct order
      try {
        await trx('member_activity_logs').where('team_id', teamId).del();
      } catch (err) {
        // Table might not exist yet
      }
      
      try {
        await trx('role_change_history').where('team_id', teamId).del();
      } catch (err) {
        // Table might not exist yet
      }
      
      try {
        await trx('team_invitations').where('team_id', teamId).del();
      } catch (err) {
        // Table might not exist yet
      }

      // Delete main data
      await trx('prds').where('team_id', teamId).del();
      await trx('templates').where('team_id', teamId).del();
      await trx('team_members').where('team_id', teamId).del();
      await trx('teams').where('id', teamId).del();
    });
  }

  // Helper methods
  private async verifyTeamMembership(teamId: string, userId: string): Promise<TeamMember> {
    const member = await db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .first();

    if (!member) {
      throw ErrorFactory.forbidden('Not a team member');
    }

    return member;
  }

  private async verifyTeamPermission(teamId: string, userId: string, allowedRoles: string[]): Promise<TeamMember> {
    const member = await this.verifyTeamMembership(teamId, userId);

    if (!allowedRoles.includes(member.role)) {
      throw ErrorFactory.forbidden('Insufficient permissions');
    }

    return member;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingTeam = await db('teams')
        .where('slug', slug)
        .first();

      if (!existingTeam) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}

export const teamService = new TeamService();