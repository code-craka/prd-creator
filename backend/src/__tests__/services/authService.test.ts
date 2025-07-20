import { authService } from '../../services/authService';
import { TestDataFactory } from '../utils/testHelpers';
import { ValidationError, UnauthorizedError, ConflictError } from '../../middleware/errorHandler';

describe('AuthService', () => {
  describe('register', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
      };

      const result = await authService.register(userData.email, userData.name, userData.password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw ValidationError for invalid email', async () => {
      await expect(
        authService.register('invalid-email', 'Test User', 'password123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for short password', async () => {
      await expect(
        authService.register('test@example.com', 'Test User', '123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for short name', async () => {
      await expect(
        authService.register('test@example.com', 'T', 'password123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError for existing email', async () => {
      const existingUser = await TestDataFactory.createUser({
        email: 'existing@example.com',
      });

      await expect(
        authService.register('existing@example.com', 'Test User', 'password123')
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const user = await TestDataFactory.createUser({
        email: 'login@example.com',
      });

      const result = await authService.login('login@example.com', 'password123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('login@example.com');
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw ValidationError for invalid email format', async () => {
      await expect(
        authService.login('invalid-email', 'password123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      await expect(
        authService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for wrong password', async () => {
      const user = await TestDataFactory.createUser({
        email: 'wrongpass@example.com',
      });

      await expect(
        authService.login('wrongpass@example.com', 'wrongpassword')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data for valid user ID', async () => {
      const user = await TestDataFactory.createUser();

      const result = await authService.getCurrentUser(user.id);

      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should throw NotFoundError for invalid user ID', async () => {
      await expect(
        authService.getCurrentUser('non-existent-id')
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile with valid data', async () => {
      const user = await TestDataFactory.createUser();
      const updates = {
        name: 'Updated Name',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      const result = await authService.updateProfile(user.id, updates);

      expect(result.name).toBe(updates.name);
      expect(result.avatar_url).toBe(updates.avatar_url);
    });

    it('should throw ValidationError for short name', async () => {
      const user = await TestDataFactory.createUser();

      await expect(
        authService.updateProfile(user.id, { name: 'A' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('changePassword', () => {
    it('should change password with correct current password', async () => {
      const user = await TestDataFactory.createUser();

      await expect(
        authService.changePassword(user.id, 'password123', 'newpassword123')
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError for short new password', async () => {
      const user = await TestDataFactory.createUser();

      await expect(
        authService.changePassword(user.id, 'password123', '123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw UnauthorizedError for wrong current password', async () => {
      const user = await TestDataFactory.createUser();

      await expect(
        authService.changePassword(user.id, 'wrongpassword', 'newpassword123')
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});