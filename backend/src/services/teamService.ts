import { db } from '../config/database';
import { generateSlug, isValidEmail } from '../utils/helpers';
import { 
  ValidationError, 
  NotFoundError, 
  ForbiddenError,
  ConflictError 
} from '../middleware/errorHandler';
import { Team, TeamMember, CreateTeamRequest } from 'prd-creator-shared';

export class TeamService {
  async createTeam(ownerId: string, data: CreateTeamRequest): Promise<Team> {
    if (!data.name || data.name.trim().length < 2) {
      throw new ValidationError('Team name must be at least 2 characters long');
    }

    const teamName = data.name.trim();
    const slug = await this.generateUniqueSlug(teamName);

    // Start transaction
    return db.transaction(async (trx) => {
      // Create team
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
      throw new NotFoundError('Team not found');
    }

    return team;
  }

  async updateTeam(teamId: string, userId: string, updates: Partial<{ name: string; description: string; avatar_url: string }>): Promise<Team> {
    // Verify user has admin permissions
    await this.verifyTeamPermission(teamId, userId, ['owner', 'admin']);

    // Validate updates
    if (updates.name && updates.name.trim().length < 2) {
      throw new ValidationError('Team name must be at least 2 characters long');
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
      throw new ValidationError('No valid updates provided');
    }

    const [team] = await db('teams')
      .where('id', teamId)
      .update(cleanUpdates)
      .returning('*');

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    return team;
  }

  async inviteMember(teamId: string, inviterId: string, email: string): Promise<void> {
    // Verify inviter has permission to invite
    await this.verifyTeamPermission(teamId, inviterId, ['owner', 'admin']);

    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email address');
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const invitee = await db('users')
      .where('email', normalizedEmail)
      .first();

    if (!invitee) {
      // TODO: Send invitation email to non-user
      // For now, we'll throw an error
      throw new NotFoundError('User with this email does not exist. Email invitations will be implemented later.');
    }

    // Check if already a member
    const existingMember = await db('team_members')
      .where({ team_id: teamId, user_id: invitee.id })
      .first();

    if (existingMember) {
      throw new ConflictError('User is already a team member');
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
      throw new NotFoundError('Team member not found');
    }

    // Can't change your own role
    if (adminId === memberId) {
      throw new ForbiddenError('Cannot change your own role');
    }

    // Only owners can assign owner role
    if (role === 'owner' && adminMember.role !== 'owner') {
      throw new ForbiddenError('Only owners can assign owner role');
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
      throw new NotFoundError('Team member not found');
    }

    // Can't remove yourself
    if (adminId === memberId) {
      throw new ForbiddenError('Cannot remove yourself from the team');
    }

    // Can't remove owner
    if (member.role === 'owner') {
      throw new ForbiddenError('Cannot remove team owner');
    }

    // Only owners can remove admins
    const adminMember = await db('team_members')
      .where({ team_id: teamId, user_id: adminId })
      .first();

    if (member.role === 'admin' && adminMember?.role !== 'owner') {
      throw new ForbiddenError('Only owners can remove admins');
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
      throw new NotFoundError('Team not found');
    }

    return team;
  }

  async deleteTeam(teamId: string, userId: string): Promise<void> {
    // Verify user is the owner
    await this.verifyTeamPermission(teamId, userId, ['owner']);

    await db.transaction(async (trx) => {
      // Update users who have this as current team
      await trx('users')
        .where('current_team_id', teamId)
        .update({ current_team_id: null });

      // Delete all related data
      await trx('analytics_events').where('team_id', teamId).del();
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
      throw new ForbiddenError('Not a team member');
    }

    return member;
  }

  private async verifyTeamPermission(teamId: string, userId: string, allowedRoles: string[]): Promise<TeamMember> {
    const member = await this.verifyTeamMembership(teamId, userId);

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenError('Insufficient permissions');
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