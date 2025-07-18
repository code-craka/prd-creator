import { db } from '../config/database';
import { 
  hashPassword, 
  comparePassword, 
  generateToken,
  isValidEmail 
} from '../utils/helpers';
import { 
  ValidationError, 
  UnauthorizedError, 
  ConflictError,
  NotFoundError 
} from '../middleware/errorHandler';
import { User, AuthResponse } from 'prd-creator-shared';

export class AuthService {
  async register(email: string, name: string, password: string): Promise<AuthResponse> {
    // Validate input
    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    if (name.trim().length < 2) {
      throw new ValidationError('Name must be at least 2 characters long');
    }

    // Check if user already exists
    const existingUser = await db('users')
      .where('email', email.toLowerCase())
      .first();

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [user] = await db('users')
      .insert({
        email: email.toLowerCase(),
        name: name.trim(),
        password_hash: passwordHash,
      })
      .returning(['id', 'email', 'name', 'current_team_id', 'created_at', 'updated_at']);

    // Generate JWT token
    const token = generateToken(user.id);

    // Remove password hash from response
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      current_team_id: user.current_team_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return {
      user: userResponse,
      token,
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    // Validate input
    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    if (!password) {
      throw new ValidationError('Password is required');
    }

    // Find user
    const user = await db('users')
      .where('email', email.toLowerCase())
      .select(['id', 'email', 'name', 'password_hash', 'avatar_url', 'current_team_id', 'created_at', 'updated_at'])
      .first();

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Remove password hash from response
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      current_team_id: user.current_team_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return {
      user: userResponse,
      token,
    };
  }

  async getCurrentUser(userId: string): Promise<User> {
    const user = await db('users')
      .where('id', userId)
      .select(['id', 'email', 'name', 'avatar_url', 'current_team_id', 'created_at', 'updated_at'])
      .first();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updates: Partial<{ name: string; avatar_url: string }>): Promise<User> {
    // Validate updates
    if (updates.name && updates.name.trim().length < 2) {
      throw new ValidationError('Name must be at least 2 characters long');
    }

    // Clean the updates
    const cleanUpdates: any = {};
    if (updates.name) {
      cleanUpdates.name = updates.name.trim();
    }
    if (updates.avatar_url) {
      cleanUpdates.avatar_url = updates.avatar_url;
    }

    if (Object.keys(cleanUpdates).length === 0) {
      throw new ValidationError('No valid updates provided');
    }

    // Update user
    const [user] = await db('users')
      .where('id', userId)
      .update(cleanUpdates)
      .returning(['id', 'email', 'name', 'avatar_url', 'current_team_id', 'created_at', 'updated_at']);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Validate new password
    if (newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters long');
    }

    // Get current user with password hash
    const user = await db('users')
      .where('id', userId)
      .select(['password_hash'])
      .first();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await db('users')
      .where('id', userId)
      .update({
        password_hash: newPasswordHash,
        updated_at: db.fn.now(),
      });
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    // Get user with password hash
    const user = await db('users')
      .where('id', userId)
      .select(['password_hash'])
      .first();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Password is incorrect');
    }

    // Start transaction for account deletion
    await db.transaction(async (trx) => {
      // Remove user from all teams (except owned teams)
      await trx('team_members')
        .where('user_id', userId)
        .whereNot('role', 'owner')
        .del();

      // Transfer ownership of teams to another admin or delete teams
      const ownedTeams = await trx('teams')
        .where('owner_id', userId);

      for (const team of ownedTeams) {
        // Try to find another admin to transfer ownership
        const adminMember = await trx('team_members')
          .where('team_id', team.id)
          .where('role', 'admin')
          .whereNot('user_id', userId)
          .first();

        if (adminMember) {
          // Transfer ownership
          await trx('teams')
            .where('id', team.id)
            .update({ owner_id: adminMember.user_id });
          
          await trx('team_members')
            .where('team_id', team.id)
            .where('user_id', adminMember.user_id)
            .update({ role: 'owner' });
        } else {
          // No admin found, delete the team and all related data
          await trx('team_members').where('team_id', team.id).del();
          await trx('prds').where('team_id', team.id).del();
          await trx('templates').where('team_id', team.id).del();
          await trx('teams').where('id', team.id).del();
        }
      }

      // Delete user's personal PRDs
      await trx('prds').where('user_id', userId).del();

      // Delete user's templates
      await trx('templates').where('created_by', userId).del();

      // Delete analytics events
      await trx('analytics_events').where('user_id', userId).del();

      // Finally delete the user
      await trx('users').where('id', userId).del();
    });
  }
}

export const authService = new AuthService();