import { db } from '../../config/database';
import { hashPassword, generateToken } from '../../utils/helpers';
import { User, Team, PRD } from 'prd-creator-shared';

// Generate a valid UUID for testing
export const generateTestUUID = (): string => {
  return '12345678-1234-4567-8901-' + Date.now().toString().padStart(12, '0').slice(-12);
};

// Generate a non-existent but valid UUID for testing
export const generateNonExistentUUID = (): string => {
  return '00000000-0000-4000-8000-000000000000';
};

export class TestDataFactory {
  static async createUser(overrides: Partial<User> = {}): Promise<User> {
    const userData = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      password_hash: await hashPassword('password123'),
      ...overrides,
    };

    const [user] = await db('users').insert(userData).returning('*');
    return user;
  }

  static async createTeam(ownerId: string, overrides: Partial<Team> = {}): Promise<Team> {
    const teamData = {
      name: `Test Team ${Date.now()}`,
      slug: `test-team-${Date.now()}`,
      owner_id: ownerId,
      description: 'Test team description',
      ...overrides,
    };

    const [team] = await db('teams').insert(teamData).returning('*');
    
    // Add owner as team member
    await db('team_members').insert({
      team_id: team.id,
      user_id: ownerId,
      role: 'owner',
    });

    return team;
  }

  static async createPRD(userId: string, overrides: Partial<PRD> = {}): Promise<PRD> {
    const prdData = {
      user_id: userId,
      title: `Test PRD ${Date.now()}`,
      content: 'This is a test PRD content',
      visibility: 'private' as const,
      metadata: {},
      ...overrides,
    };

    const [prd] = await db('prds').insert(prdData).returning('*');
    return prd;
  }

  static async createAuthenticatedUser(): Promise<{ user: User; token: string }> {
    const user = await this.createUser();
    const token = generateToken(user.id);
    return { user, token };
  }

  static async addUserToTeam(teamId: string, userId: string, role: 'admin' | 'member' = 'member') {
    await db('team_members').insert({
      team_id: teamId,
      user_id: userId,
      role,
    });
  }
}

export const mockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides,
});

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

export const expectValidationError = (response: any, field?: string) => {
  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
  expect(response.body.error).toBe('Validation error');
  if (field) {
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field })
      ])
    );
  }
};

export const expectUnauthorizedError = (response: any) => {
  expect(response.status).toBe(401);
  expect(response.body.success).toBe(false);
};

export const expectNotFoundError = (response: any) => {
  expect(response.status).toBe(404);
  expect(response.body.success).toBe(false);
};

// Database cleanup utilities
export const clearDatabase = async () => {
  await db('team_members').del();
  await db('prds').del();
  await db('teams').del();
  await db('users').del();
};

export const cleanup = async () => {
  await clearDatabase();
  // Close database connection if needed
};

// Consolidated testHelpers object for backward compatibility
export const testHelpers = {
  createUser: TestDataFactory.createUser,
  createTeam: (overrides: Partial<Team> & { ownerId: string }) => {
    const { ownerId, ...teamOverrides } = overrides;
    return TestDataFactory.createTeam(ownerId, teamOverrides);
  },
  createPRD: (overrides: Partial<PRD> & { teamId?: string; createdBy: string }) => {
    const { createdBy, teamId, ...prdOverrides } = overrides;
    return TestDataFactory.createPRD(createdBy, { team_id: teamId, ...prdOverrides });
  },
  createUserWithToken: TestDataFactory.createAuthenticatedUser,
  addUserToTeam: TestDataFactory.addUserToTeam,
  clearDatabase,
  cleanup,
  mockRequest,
  mockResponse,
  expectValidationError,
  expectUnauthorizedError,
  expectNotFoundError,
};