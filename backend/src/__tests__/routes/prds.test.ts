import request from 'supertest';
import app from '../../app';
import { testHelpers } from '../utils/testHelpers';

describe('PRDs Routes', () => {
  beforeEach(async () => {
    await testHelpers.clearDatabase();
  });

  afterAll(async () => {
    await testHelpers.cleanup();
  });

  describe('GET /api/prds', () => {
    it('should return user PRDs when authenticated', async () => {
      const { user, token } = await testHelpers.createUserWithToken();
      const team = await testHelpers.createTeam({ ownerId: user.id });
      const prd = await testHelpers.createPRD({ teamId: team.id, createdBy: user.id });

      const response = await request(app)
        .get('/api/prds')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('prds');
      expect(response.body.prds).toHaveLength(1);
      expect(response.body.prds[0].id).toBe(prd.id);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/prds')
        .expect(401);
    });
  });

  describe('POST /api/prds', () => {
    it('should create a new PRD', async () => {
      const { user, token } = await testHelpers.createUserWithToken();
      const team = await testHelpers.createTeam({ ownerId: user.id });
      const prdData = {
        title: 'Test PRD',
        description: 'A test PRD',
        teamId: team.id
      };

      const response = await request(app)
        .post('/api/prds')
        .set('Authorization', `Bearer ${token}`)
        .send(prdData)
        .expect(201);

      expect(response.body).toHaveProperty('prd');
      expect(response.body.prd.title).toBe(prdData.title);
      expect(response.body.prd.teamId).toBe(team.id);
    });

    it('should return 400 for invalid PRD data', async () => {
      const { token } = await testHelpers.createUserWithToken();

      await request(app)
        .post('/api/prds')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/prds/:id', () => {
    it('should return PRD when user has access', async () => {
      const { user, token } = await testHelpers.createUserWithToken();
      const team = await testHelpers.createTeam({ ownerId: user.id });
      const prd = await testHelpers.createPRD({ teamId: team.id, createdBy: user.id });

      const response = await request(app)
        .get(`/api/prds/${prd.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.prd.id).toBe(prd.id);
    });

    it('should return 404 for non-existent PRD', async () => {
      const { token } = await testHelpers.createUserWithToken();

      await request(app)
        .get('/api/prds/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PUT /api/prds/:id', () => {
    it('should update PRD when user has access', async () => {
      const { user, token } = await testHelpers.createUserWithToken();
      const team = await testHelpers.createTeam({ ownerId: user.id });
      const prd = await testHelpers.createPRD({ teamId: team.id, createdBy: user.id });
      const updateData = { title: 'Updated PRD Title' };

      const response = await request(app)
        .put(`/api/prds/${prd.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.prd.title).toBe(updateData.title);
    });

    it('should return 403 when user lacks access', async () => {
      const { token } = await testHelpers.createUserWithToken();
      const otherUser = await testHelpers.createUser();
      const team = await testHelpers.createTeam({ ownerId: otherUser.id });
      const prd = await testHelpers.createPRD({ teamId: team.id, createdBy: otherUser.id });

      await request(app)
        .put(`/api/prds/${prd.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Hacked Title' })
        .expect(403);
    });
  });

  describe('DELETE /api/prds/:id', () => {
    it('should delete PRD when user has access', async () => {
      const { user, token } = await testHelpers.createUserWithToken();
      const team = await testHelpers.createTeam({ ownerId: user.id });
      const prd = await testHelpers.createPRD({ teamId: team.id, createdBy: user.id });

      await request(app)
        .delete(`/api/prds/${prd.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should return 403 when user lacks access', async () => {
      const { token } = await testHelpers.createUserWithToken();
      const otherUser = await testHelpers.createUser();
      const team = await testHelpers.createTeam({ ownerId: otherUser.id });
      const prd = await testHelpers.createPRD({ teamId: team.id, createdBy: otherUser.id });

      await request(app)
        .delete(`/api/prds/${prd.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});