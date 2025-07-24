/**
 * Shared User Profile Types
 * Contains all user profile related types, interfaces, and request/response schemas
 * used across frontend and backend for user management, authentication, and profiles
 */

import { User } from './index';

// ============================================================================
// AUTHENTICATION TYPES
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

// ============================================================================
// PROFILE UPDATE TYPES
// ============================================================================

/**
 * Basic profile update request for user name and avatar
 * Used for standard profile updates in auth contexts
 */
export interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
}

/**
 * Extended profile update request for onboarding and setup
 * Used during user onboarding and profile configuration
 */
export interface UpdateOnboardingProfileRequest {
  companyType?: string;
  industry?: string;
  teamSize?: string;
  experienceLevel?: string;
  preferences?: Record<string, any>;
}

/**
 * Combined profile update request that includes both basic and onboarding fields
 * Useful for comprehensive profile updates
 */
export interface UpdateCompleteProfileRequest extends UpdateProfileRequest, UpdateOnboardingProfileRequest {}

// ============================================================================
// CREATOR PROFILE TYPES (for marketplace)
// ============================================================================

export interface CreatorProfile {
  user_id: string;
  total_templates: number;
  total_sales: number;
  total_revenue: number;
  average_rating: number;
  total_downloads: number;
  featured_templates: number;
  top_templates: Array<{
    name: string;
    downloads: number;
    rating: number;
    revenue: number;
  }>;
}

export interface CreatorStats {
  templates_created: number;
  templates_published: number;
  templates_featured: number;
  total_downloads: number;
  total_revenue: number;
  average_rating: number;
  total_reviews: number;
}

// ============================================================================
// USER SETTINGS AND PREFERENCES
// ============================================================================

export interface UserPreferences {
  notifications: {
    email_notifications: boolean;
    push_notifications: boolean;
    marketing_emails: boolean;
    product_updates: boolean;
    prd_comments: boolean;
    team_invitations: boolean;
    marketplace_updates: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'team' | 'private';
    show_activity: boolean;
    show_email: boolean;
    allow_team_invitations: boolean;
  };
  workspace: {
    default_visibility: 'private' | 'team' | 'public';
    auto_save_interval: number;
    theme: 'light' | 'dark' | 'auto';
    sidebar_collapsed: boolean;
  };
  marketplace: {
    show_purchased_templates: boolean;
    auto_update_templates: boolean;
    share_usage_data: boolean;
  };
}

export interface UpdateUserPreferencesRequest {
  notifications?: Partial<UserPreferences['notifications']>;
  privacy?: Partial<UserPreferences['privacy']>;
  workspace?: Partial<UserPreferences['workspace']>;
  marketplace?: Partial<UserPreferences['marketplace']>;
}

// ============================================================================
// USER PROFILE VIEWS
// ============================================================================

/**
 * Extended user profile with additional computed fields
 * Used for displaying user profiles with stats and activity
 */
export interface UserProfileWithStats extends User {
  stats: {
    prds_created: number;
    prds_published: number;
    teams_joined: number;
    templates_created: number;
    marketplace_downloads: number;
    profile_completion: number;
  };
  activity: {
    last_login: Date | string;
    last_prd_created: Date | string | null;
    last_team_activity: Date | string | null;
    days_since_signup: number;
  };
  preferences: UserPreferences;
}

/**
 * Public user profile for displaying in galleries, team lists, etc.
 * Contains only publicly visible information
 */
export interface PublicUserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  company?: string | null;
  industry?: string | null;
  bio?: string | null;
  joined_date: Date | string;
  public_stats: {
    public_prds: number;
    marketplace_templates: number;
    total_downloads: number;
    average_rating: number;
  };
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate basic profile update data
 */
export function validateUpdateProfileRequest(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name must be a non-empty string');
    } else if (data.name.trim().length > 100) {
      errors.push('Name must be less than 100 characters');
    }
  }

  if (data.avatar_url !== undefined) {
    if (data.avatar_url !== null && typeof data.avatar_url !== 'string') {
      errors.push('Avatar URL must be a string or null');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate onboarding profile update data
 */
export function validateUpdateOnboardingProfileRequest(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const validCompanyTypes = ['startup', 'small_business', 'enterprise', 'freelance', 'agency', 'nonprofit', 'other'];
  const validTeamSizes = ['1', '2-5', '6-10', '11-25', '26-50', '51-100', '100+'];
  const validExperienceLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

  if (data.companyType !== undefined && !validCompanyTypes.includes(data.companyType)) {
    errors.push('Invalid company type');
  }

  if (data.teamSize !== undefined && !validTeamSizes.includes(data.teamSize)) {
    errors.push('Invalid team size');
  }

  if (data.experienceLevel !== undefined && !validExperienceLevels.includes(data.experienceLevel)) {
    errors.push('Invalid experience level');
  }

  if (data.industry !== undefined) {
    if (typeof data.industry !== 'string' || data.industry.trim().length === 0) {
      errors.push('Industry must be a non-empty string');
    }
  }

  if (data.preferences !== undefined) {
    if (typeof data.preferences !== 'object' || Array.isArray(data.preferences)) {
      errors.push('Preferences must be an object');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate password change request
 */
export function validateChangePasswordRequest(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.currentPassword || typeof data.currentPassword !== 'string') {
    errors.push('Current password is required');
  }

  if (!data.newPassword || typeof data.newPassword !== 'string') {
    errors.push('New password is required');
  } else {
    if (data.newPassword.length < 8) {
      errors.push('New password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.newPassword)) {
      errors.push('New password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize user profile data for safe display
 */
export function sanitizeUserProfileData(data: any): Partial<PublicUserProfile> {
  return {
    id: data.id,
    name: typeof data.name === 'string' ? data.name.trim() : '',
    avatar_url: typeof data.avatar_url === 'string' ? data.avatar_url : null,
    company: typeof data.company === 'string' ? data.company.trim() || null : null,
    industry: typeof data.industry === 'string' ? data.industry.trim() || null : null,
    bio: typeof data.bio === 'string' ? data.bio.trim() || null : null,
    joined_date: data.created_at || data.joined_date,
  };
}

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(user: User, onboarding?: any): number {
  let completedFields = 0;
  const totalFields = 8;

  // Basic fields
  if (user.name && user.name.trim().length > 0) completedFields++;
  if (user.email && user.email.trim().length > 0) completedFields++;
  if (user.avatar_url) completedFields++;

  // Onboarding fields
  if (onboarding?.company_type) completedFields++;
  if (onboarding?.industry) completedFields++;
  if (onboarding?.team_size) completedFields++;
  if (onboarding?.experience_level) completedFields++;
  if (onboarding?.preferences && Object.keys(onboarding.preferences).length > 0) completedFields++;

  return Math.round((completedFields / totalFields) * 100);
}
