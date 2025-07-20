import request from 'supertest';
import app from '../../app';
import { testHelpers } from '../utils/testHelpers';

describe('Teams Routes', () => {
  beforeEach(async () => {
    await testHelpers.clearDatabase();
  });

  afterAll(async () => {
    await testHelpers.cleanup();
  });

  describe('GET /api/teams', () => {
    it('should return user teams when authenticated', async () => {
      const { user, token } = await testHelpers.createUserWithToken();
      const team = await testHelpers.createTeam({ ownerId: user.id });

      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('teams');
      expect(response.body.teams).toHaveLength(1);
      expect(response.body.teams[0].id).toBe(team.id);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/teams')
        .expect(401);
    });
  });

  describe('POST /api/teams', () => {
    it('should create a new team', async () => {
      const { token } = await testHelpers.createUserWithToken();
      const teamData = {
        name: 'Test Team',
        description: 'A test team'
      };

      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .send(teamData)
        .expect(201);

      expect(response.body).toHaveProperty('team');
      expect(response.body.team.name).toBe(teamData.name);
      expect(response.body.team.description).toBe(teamData.description);
    });

    it('should return 400 for invalid team data', async () => {
      const { token } = await testHelpers.createUserWithToken();

      await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });
  });

  describe('PUT /api/teams/:id', () => {
    it('should update team when user is owner', async () => {
      const { user, token } = await testHelpers.createUserWithToken();
      const team = await testHelpers.createTeam({ ownerId: user.id });
      const updateData = { name: 'Updated Team Name' };

      const response = await request(app)
        .put(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.team.name).toBe(updateData.name);
    });

    it('should return 403 when user is not owner', async () => {
      const { token } = await testHelpers.createUserWithToken();
      const otherUser = await testHelpers.createUser();
      const team = await testHelpers.createTeam({ ownerId: otherUser.id });

      await request(app)
        .put(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Hacked Name' })
        .expect(403);
    });
  });

  describe('DELETE /api/teams/:id', () => {
    it('should delete team when user is owner', async () => {
      const { user, token } = await testHelpers.createUserWithToken();
      const team = await testHelpers.createTeam({ ownerId: user.id });

      await request(app)
        .delete(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should return 403 when user is not owner', async () => {
      const { token } = await testHelpers.createUserWithToken();
      const otherUser = await testHelpers.createUser();
      const team = await testHelpers.createTeam({ ownerId: otherUser.id });

      await request(app)
        .delete(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});