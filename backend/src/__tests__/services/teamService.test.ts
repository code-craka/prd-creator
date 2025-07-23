import { teamService } from '../../services/teamService';
import { TestDataFactory, generateNonExistentUUID } from '../utils/testHelpers';
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from '../../utils/errorHelpers';

describe('TeamService', () => {
  describe('createTeam', () => {
    it('should create a new team with valid data', async () => {
      const user = await TestDataFactory.createUser();
      const teamData = { name: 'Test Team' };

      const result = await teamService.createTeam(user.id, teamData);

      expect(result.name).toBe(teamData.name);
      expect(result.owner_id).toBe(user.id);
      expect(result.slug).toMatch(/^test-team/);
    });

    it('should throw ValidationError for short team name', async () => {
      const user = await TestDataFactory.createUser();

      await expect(
        teamService.createTeam(user.id, { name: 'T' })
      ).rejects.toThrow(ValidationError);
    });

    it('should generate unique slug for duplicate names', async () => {
      const user = await TestDataFactory.createUser();
      const teamName = 'Duplicate Team';

      const team1 = await teamService.createTeam(user.id, { name: teamName });
      const team2 = await teamService.createTeam(user.id, { name: teamName });

      expect(team1.slug).not.toBe(team2.slug);
      expect(team2.slug).toMatch(/duplicate-team-\d+/);
    });
  });

  describe('getUserTeams', () => {
    it('should return all teams for a user', async () => {
      const user = await TestDataFactory.createUser();
      const team1 = await TestDataFactory.createTeam(user.id, { name: 'Team 1' });
      const team2 = await TestDataFactory.createTeam(user.id, { name: 'Team 2' });

      const result = await teamService.getUserTeams(user.id);

      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toContain(team1.id);
      expect(result.map(t => t.id)).toContain(team2.id);
      expect(result[0]).toHaveProperty('role');
    });

    it('should return empty array for user with no teams', async () => {
      const user = await TestDataFactory.createUser();

      const result = await teamService.getUserTeams(user.id);

      expect(result).toHaveLength(0);
    });
  });

  describe('inviteMember', () => {
    it('should invite existing user to team', async () => {
      const owner = await TestDataFactory.createUser();
      const invitee = await TestDataFactory.createUser();
      const team = await TestDataFactory.createTeam(owner.id);

      await expect(
        teamService.inviteMember(team.id, owner.id, invitee.email)
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError for invalid email', async () => {
      const owner = await TestDataFactory.createUser();
      const team = await TestDataFactory.createTeam(owner.id);

      await expect(
        teamService.inviteMember(team.id, owner.id, 'invalid-email')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ForbiddenError when non-admin tries to invite', async () => {
      const owner = await TestDataFactory.createUser();
      const member = await TestDataFactory.createUser();
      const invitee = await TestDataFactory.createUser();
      const team = await TestDataFactory.createTeam(owner.id);
      
      await TestDataFactory.addUserToTeam(team.id, member.id, 'member');

      await expect(
        teamService.inviteMember(team.id, member.id, invitee.email)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ConflictError when user is already a member', async () => {
      const owner = await TestDataFactory.createUser();
      const member = await TestDataFactory.createUser();
      const team = await TestDataFactory.createTeam(owner.id);
      
      await TestDataFactory.addUserToTeam(team.id, member.id, 'member');

      await expect(
        teamService.inviteMember(team.id, owner.id, member.email)
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role when called by owner', async () => {
      const owner = await TestDataFactory.createUser();
      const member = await TestDataFactory.createUser();
      const team = await TestDataFactory.createTeam(owner.id);
      
      await TestDataFactory.addUserToTeam(team.id, member.id, 'member');

      await expect(
        teamService.updateMemberRole(team.id, owner.id, member.id, 'admin')
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenError when trying to change own role', async () => {
      const owner = await TestDataFactory.createUser();
      const team = await TestDataFactory.createTeam(owner.id);

      await expect(
        teamService.updateMemberRole(team.id, owner.id, owner.id, 'admin')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError for non-existent member', async () => {
      const owner = await TestDataFactory.createUser();
      const team = await TestDataFactory.createTeam(owner.id);
      const nonExistentId = generateNonExistentUUID();

      await expect(
        teamService.updateMemberRole(team.id, owner.id, nonExistentId, 'admin')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('removeMember', () => {
    it('should remove member when called by owner', async () => {
      const owner = await TestDataFactory.createUser();
      const member = await TestDataFactory.createUser();
      const team = await TestDataFactory.createTeam(owner.id);
      
      await TestDataFactory.addUserToTeam(team.id, member.id, 'member');

      await expect(
        teamService.removeMember(team.id, owner.id, member.id)
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenError when trying to remove self', async () => {
      const owner = await TestDataFactory.createUser();
      const team = await TestDataFactory.createTeam(owner.id);

      await expect(
        teamService.removeMember(team.id, owner.id, owner.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when trying to remove owner', async () => {
      const owner = await TestDataFactory.createUser();
      const admin = await TestDataFactory.createUser();
      const team = await TestDataFactory.createTeam(owner.id);
      
      await TestDataFactory.addUserToTeam(team.id, admin.id, 'admin');

      await expect(
        teamService.removeMember(team.id, admin.id, owner.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('switchTeam', () => {
    it('should switch to team when user is member', async () => {
      const user = await TestDataFactory.createUser();
      const team = await TestDataFactory.createTeam(user.id);

      const result = await teamService.switchTeam(user.id, team.id);

      expect(result.id).toBe(team.id);
    });

    it('should throw ForbiddenError when user is not team member', async () => {
      const user = await TestDataFactory.createUser();
      const owner = await TestDataFactory.createUser();
      const team = await TestDataFactory.createTeam(owner.id);

      await expect(
        teamService.switchTeam(user.id, team.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});