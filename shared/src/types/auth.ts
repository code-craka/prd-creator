/**
 * Shared Authentication Types
 * Contains all authentication-related types, interfaces, and request/response schemas
 * used across frontend and backend for authentication, authorization, and user management
 */

import { Request } from 'express';
import { User } from './index';

// ============================================================================
// AUTHENTICATION REQUEST/RESPONSE TYPES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
}

// ============================================================================
// BACKEND-SPECIFIC AUTHENTICATION TYPES
// ============================================================================

/**
 * Extended Express Request with authenticated user
 * Used in backend middleware and route handlers
 */
export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * JWT Token payload structure
 * Used for token generation and verification
 */
export interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// ============================================================================
// AUTHENTICATION STATE TYPES (Frontend)
// ============================================================================

/**
 * Authentication state for frontend state management
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Authentication actions for frontend state management
 */
export interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Password validation requirements
 */
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

/**
 * Authentication validation result
 */
export interface AuthValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * User roles for authorization
 */
export type UserRole = 'user' | 'admin' | 'moderator';

/**
 * Authentication providers
 */
export type AuthProvider = 'email' | 'google' | 'github' | 'microsoft';

/**
 * Token types
 */
export type TokenType = 'access' | 'refresh' | 'reset' | 'verification';

/**
 * Authentication events for logging/analytics
 */
export type AuthEvent = 
  | 'login_success'
  | 'login_failed'
  | 'register_success'
  | 'register_failed'
  | 'logout'
  | 'password_changed'
  | 'profile_updated'
  | 'token_refreshed'
  | 'password_reset_requested'
  | 'password_reset_completed';