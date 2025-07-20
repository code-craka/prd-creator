import request from 'supertest';
import app from '../../app';
import { TestDataFactory, expectValidationError, expectUnauthorizedError } from '../utils/testHelpers';

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should return validation error for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expectValidationError(response);
    });

    it('should return validation error for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          name: 'Test User',
          password: 'password123',
        });

      expectValidationError(response, 'email');
    });

    it('should return validation error for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          password: '123',
        });

      expectValidationError(response, 'password');
    });

    it('should return conflict error for existing email', async () => {
      const existingUser = await TestDataFactory.createUser({
        email: 'existing@example.com',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          name: 'Test User',
          password: 'password123',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with correct credentials', async () => {
      const user = await TestDataFactory.createUser({
        email: 'login@example.com',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('login@example.com');
    });

    it('should return validation error for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expectValidationError(response);
    });

    it('should return unauthorized for wrong credentials', async () => {
      const user = await TestDataFactory.createUser({
        email: 'wrongcreds@example.com',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongcreds@example.com',
          password: 'wrongpassword',
        });

      expectUnauthorizedError(response);
    });

    it('should return unauthorized for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expectUnauthorizedError(response);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user data with valid token', async () => {
      const { user, token } = await TestDataFactory.createAuthenticatedUser();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('should return unauthorized without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expectUnauthorizedError(response);
    });

    it('should return unauthorized with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expectUnauthorizedError(response);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile with valid data', async () => {
      const { user, token } = await TestDataFactory.createAuthenticatedUser();
      const updates = {
        name: 'Updated Name',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(updates.name);
      expect(response.body.data.user.avatar_url).toBe(updates.avatar_url);
    });

    it('should return unauthorized without token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'Updated Name' });

      expectUnauthorizedError(response);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password with correct current password', async () => {
      const { user, token } = await TestDataFactory.createAuthenticatedUser();

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return unauthorized for wrong current password', async () => {
      const { user, token } = await TestDataFactory.createAuthenticatedUser();

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        });

      expectUnauthorizedError(response);
    });

    it('should return validation error for short new password', async () => {
      const { user, token } = await TestDataFactory.createAuthenticatedUser();

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: '123',
        });

      expectValidationError(response);
    });
  });
});