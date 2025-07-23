import { AuthService } from '../../services/authService';
import { TestDataFactory, generateNonExistentUUID } from '../utils/testHelpers';
import { NotFoundError, ValidationError, UnauthorizedError, ConflictError } from '../../utils/errorHelpers';

describe('AuthService', () => {
  describe('register', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
      };

      const result = await AuthService.register(userData.email, userData.name, userData.password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw ValidationError for invalid email', async () => {
      await expect(
        AuthService.register('invalid-email', 'Test User', 'password123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for short password', async () => {
      await expect(
        AuthService.register('test@example.com', 'Test User', '123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for short name', async () => {
      await expect(
        AuthService.register('test@example.com', 'T', 'password123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError for existing email', async () => {
      const existingUser = await TestDataFactory.createUser({
        email: 'existing@example.com',
      });

      await expect(
        AuthService.register('existing@example.com', 'Test User', 'password123')
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const user = await TestDataFactory.createUser({
        email: 'login@example.com',
      });

      const result = await AuthService.login('login@example.com', 'password123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('login@example.com');
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw ValidationError for invalid email format', async () => {
      await expect(
        AuthService.login('invalid-email', 'password123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      await expect(
        AuthService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for wrong password', async () => {
      const user = await TestDataFactory.createUser({
        email: 'wrongpass@example.com',
      });

      await expect(
        AuthService.login('wrongpass@example.com', 'wrongpassword')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data for valid user ID', async () => {
      const user = await TestDataFactory.createUser();

      const result = await AuthService.getCurrentUser(user.id);

      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should throw NotFoundError for invalid user ID', async () => {
      const nonExistentId = generateNonExistentUUID();
      await expect(
        AuthService.getCurrentUser(nonExistentId)
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

      const result = await AuthService.updateProfile(user.id, updates);

      expect(result.name).toBe(updates.name);
      expect(result.avatar_url).toBe(updates.avatar_url);
    });

    it('should throw ValidationError for short name', async () => {
      const user = await TestDataFactory.createUser();

      await expect(
        AuthService.updateProfile(user.id, { name: 'A' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('changePassword', () => {
    it('should change password with correct current password', async () => {
      const user = await TestDataFactory.createUser();

      await expect(
        AuthService.changePassword(user.id, 'password123', 'newpassword123')
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError for short new password', async () => {
      const user = await TestDataFactory.createUser();

      await expect(
        AuthService.changePassword(user.id, 'password123', '123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw UnauthorizedError for wrong current password', async () => {
      const user = await TestDataFactory.createUser();

      await expect(
        AuthService.changePassword(user.id, 'wrongpassword', 'newpassword123')
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});