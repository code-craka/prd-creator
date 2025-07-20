import { prdService } from '../../services/prdService';
import { testHelpers } from '../utils/testHelpers';

describe('PRD Service', () => {
  beforeEach(async () => {
    await testHelpers.clearDatabase();
  });

  afterAll(async () => {
    await testHelpers.cleanup();
  });

  describe('createPRD', () => {
    it('should create a new PRD successfully', async () => {
      const user = await testHelpers.createUser();
      const team = await testHelpers.createTeam({ ownerId: user.id });
      const prdData = {
        title: 'Test PRD',
        content: 'A test PRD content',
        teamId: team.id,
        visibility: 'team' as const
      };

      const prd = await prdService.createPRD(user.id, prdData);

      expect(prd).toHaveProperty('id');
      expect(prd.title).toBe(prdData.title);
      expect(prd.content).toBe(prdData.content);
      expect(prd.team_id).toBe(team.id);
      expect(prd.user_id).toBe(user.id);
    });

    it('should throw error for invalid team', async () => {
      const user = await testHelpers.createUser();
      const prdData = {
        title: 'Test PRD',
        content: 'A test PRD content',
        teamId: '999999',
        visibility: 'team' as const
      };

      await expect(prdService.createPRD(user.id, prdData)).rejects.toThrow();
    });
  });

  describe('getPRD', () => {
    it('should return PRD when it exists', async () => {
      const user = await testHelpers.createUser();
      const team = await testHelpers.createTeam({ ownerId: user.id });
      const createdPRD = await testHelpers.createPRD({ teamId: team.id, createdBy: user.id });

      const prd = await prdService.getPRD(createdPRD.id, user.id);

      expect(prd).toBeTruthy();
      expect(prd.id).toBe(createdPRD.id);
    });

    it('should throw error when PRD does not exist', async () => {
      const user = await testHelpers.createUser();
      await expect(prdService.getPRD('999999', user.id)).rejects.toThrow();
    });
  });

  describe('updatePRD', () => {
    it('should update PRD successfully', async () => {
      const user = await testHelpers.createUser();
      const team = await testHelpers.createTeam({ ownerId: user.id });
      const prd = await testHelpers.createPRD({ teamId: team.id, createdBy: user.id });
      const updateData = { title: 'Updated Title' };

      const updatedPRD = await prdService.updatePRD(prd.id, user.id, updateData);

      expect(updatedPRD.title).toBe(updateData.title);
    });

    it('should throw error when PRD does not exist', async () => {
      const user = await testHelpers.createUser();
      await expect(prdService.updatePRD('999999', user.id, { title: 'New Title' }))
        .rejects.toThrow();
    });
  });

  describe('deletePRD', () => {
    it('should delete PRD successfully', async () => {
      const user = await testHelpers.createUser();
      const team = await testHelpers.createTeam({ ownerId: user.id });
      const prd = await testHelpers.createPRD({ teamId: team.id, createdBy: user.id });

      await prdService.deletePRD(prd.id, user.id);

      await expect(prdService.getPRD(prd.id, user.id)).rejects.toThrow();
    });

    it('should throw error when PRD does not exist', async () => {
      const user = await testHelpers.createUser();
      await expect(prdService.deletePRD('999999', user.id)).rejects.toThrow();
    });
  });

  describe('getUserPRDs', () => {
    it('should return user PRDs', async () => {
      const user = await testHelpers.createUser();
      const team = await testHelpers.createTeam({ ownerId: user.id });
      await testHelpers.createPRD({ teamId: team.id, createdBy: user.id });
      await testHelpers.createPRD({ teamId: team.id, createdBy: user.id });

      const result = await prdService.getUserPRDs(user.id);

      expect(result.data).toHaveLength(2);
      expect(result.data.every(prd => prd.user_id === user.id)).toBe(true);
    });

    it('should return empty array when user has no PRDs', async () => {
      const user = await testHelpers.createUser();

      const result = await prdService.getUserPRDs(user.id);

      expect(result.data).toHaveLength(0);
    });
  });

  describe('getTeamPRDs', () => {
    it('should return team PRDs', async () => {
      const user = await testHelpers.createUser();
      const team = await testHelpers.createTeam({ ownerId: user.id });
      await testHelpers.createPRD({ teamId: team.id, createdBy: user.id });
      await testHelpers.createPRD({ teamId: team.id, createdBy: user.id });

      const result = await prdService.getTeamPRDs(team.id, user.id);

      expect(result.data).toHaveLength(2);
      expect(result.data.every(prd => prd.team_id === team.id)).toBe(true);
    });

    it('should return empty array when team has no PRDs', async () => {
      const user = await testHelpers.createUser();
      const team = await testHelpers.createTeam({ ownerId: user.id });

      const result = await prdService.getTeamPRDs(team.id, user.id);

      expect(result.data).toHaveLength(0);
    });
  });
});