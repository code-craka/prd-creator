import { db } from '../config/database';
import { Knex } from 'knex';
import { 
  hashPassword, 
  comparePassword, 
  generateToken
} from '../utils/helpers';
import { 
  ErrorFactory,
  ValidationHelpers
} from '../utils/errorHelpers';
import { userDb } from '../utils/dbHelpers';
import { User, AuthResponse } from 'prd-creator-shared';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AuthService {
  static async register(email: string, name: string, password: string): Promise<AuthResponse> {
    // Validate input using utility helpers
    ValidationHelpers.validateEmail(email);
    ValidationHelpers.validatePassword(password);
    ValidationHelpers.validateRequired(name.trim(), 'Name');
    
    if (name.trim().length < 2) {
      throw ErrorFactory.validation('Name must be at least 2 characters long');
    }

    // Check if user already exists using dbHelper
    const existingUser = await userDb.findByEmail(email);
    if (existingUser) {
      throw ErrorFactory.emailExists();
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user using dbHelper
    const user = await userDb.create({
      email: email.toLowerCase(),
      name: name.trim(),
      password_hash: passwordHash,
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Return clean user response
    return {
      user: AuthService.sanitizeUser(user),
      token,
    };
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    // Validate input using utility helpers
    ValidationHelpers.validateEmail(email);
    ValidationHelpers.validateRequired(password, 'Password');

    // Find user with password hash using dbHelper
    const user = await userDb.findByEmailWithPassword(email);
    if (!user) {
      throw ErrorFactory.unauthorized('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw ErrorFactory.unauthorized('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(user.id);

    return {
      user: AuthService.sanitizeUser(user),
      token,
    };
  }

  static async getCurrentUser(userId: string): Promise<User> {
    // Validate UUID format first
    try {
      ValidationHelpers.validateUUID(userId, 'User ID');
    } catch (error) {
      // Convert UUID validation errors to user not found for security
      throw ErrorFactory.userNotFound();
    }
    
    const user = await userDb.findById(userId);
    if (!user) {
      throw ErrorFactory.userNotFound();
    }
    return user;
  }

  static async updateProfile(userId: string, updates: Partial<{ name: string; avatar_url: string }>): Promise<User> {
    // Validate and clean updates
    const cleanUpdates = AuthService.validateAndCleanProfileUpdates(updates);
    
    if (Object.keys(cleanUpdates).length === 0) {
      throw ErrorFactory.validation('No valid updates provided');
    }

    // Update user using dbHelper
    const user = await userDb.update(userId, cleanUpdates);
    if (!user) {
      throw ErrorFactory.userNotFound();
    }

    return user;
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Validate new password
    ValidationHelpers.validatePassword(newPassword);

    // Get current user with password hash using dbHelper
    const user = await userDb.findByIdWithPassword(userId);
    if (!user) {
      throw ErrorFactory.userNotFound();
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw ErrorFactory.unauthorized('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password using dbHelper
    await userDb.update(userId, {
      password_hash: newPasswordHash,
    });
  }

  static async deleteAccount(userId: string, password: string): Promise<void> {
    // Get user with password hash using dbHelper
    const user = await userDb.findByIdWithPassword(userId);
    if (!user) {
      throw ErrorFactory.userNotFound();
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw ErrorFactory.unauthorized('Password is incorrect');
    }

    // Start transaction for account deletion
    await AuthService.executeAccountDeletion(userId);
  }

  static async updateCurrentTeam(userId: string, teamId: string | null): Promise<User> {
    const user = await userDb.update(userId, { current_team_id: teamId });
    if (!user) {
      throw ErrorFactory.userNotFound();
    }
    return user;
  }

  // Helper method to remove sensitive data from user object
  private static sanitizeUser(user: Record<string, unknown>): User {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser as unknown as User;
  }

  // Helper method to validate and clean profile updates
  private static validateAndCleanProfileUpdates(updates: Partial<{ name: string; avatar_url: string }>): Record<string, string> {
    if (updates.name && updates.name.trim().length < 2) {
      throw ErrorFactory.validation('Name must be at least 2 characters long');
    }

    const cleanUpdates: Record<string, string> = {};
    if (updates.name) {
      cleanUpdates.name = updates.name.trim();
    }
    if (updates.avatar_url) {
      cleanUpdates.avatar_url = updates.avatar_url;
    }

    return cleanUpdates;
  }

  // Helper method to handle complex account deletion logic
  private static async executeAccountDeletion(userId: string): Promise<void> {
    await db.transaction(async (trx: Knex.Transaction) => {
      // Remove user from all teams (except owned teams)
      await trx('team_members')
        .where('user_id', userId)
        .whereNot('role', 'owner')
        .del();

      // Handle team ownership transfer or deletion
      await AuthService.handleTeamOwnershipTransfer(trx, userId);

      // Delete user's personal data
      await AuthService.deleteUserPersonalData(trx, userId);

      // Finally delete the user
      await trx('users').where('id', userId).del();
    });
  }

  // Helper method to handle team ownership transfer
  private static async handleTeamOwnershipTransfer(trx: Knex.Transaction, userId: string): Promise<void> {
    const ownedTeams = await trx('teams').where('owner_id', userId);

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
  }

  // Helper method to delete user's personal data
  private static async deleteUserPersonalData(trx: Knex.Transaction, userId: string): Promise<void> {
    // Delete user's personal PRDs
    await trx('prds').where('user_id', userId).del();

    // Delete user's templates
    await trx('templates').where('created_by', userId).del();

    // Delete analytics events
    await trx('analytics_events').where('user_id', userId).del();
  }
}