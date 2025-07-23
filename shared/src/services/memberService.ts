/**
 * Shared Member Service
 * Contains shared business logic, validation, and utility functions
 * for member management across frontend and backend
 */

import { 
  TeamMember, 
  TeamInvitation, 
  MemberActivityLog, 
  RoleChangeHistory 
} from '../types/team';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const TEAM_ROLES = ['owner', 'admin', 'member'] as const;
export type TeamRole = typeof TEAM_ROLES[number];

export const INVITATION_STATUSES = ['pending', 'accepted', 'declined', 'cancelled', 'expired'] as const;
export type InvitationStatus = typeof INVITATION_STATUSES[number];

export const MEMBER_ACTIONS = ['invite', 'remove', 'change_role', 'manage_invitations'] as const;
export type MemberAction = typeof MEMBER_ACTIONS[number];

export const ACTIVITY_ACTIONS = [
  'invitation_sent',
  'invitation_resent', 
  'invitation_cancelled',
  'member_removed',
  'role_changed',
  'member_joined'
] as const;
export type ActivityAction = typeof ACTIVITY_ACTIONS[number];

// Default invitation expiry in days
export const DEFAULT_INVITATION_EXPIRY_DAYS = 7;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate if a role is valid
 */
export function isValidRole(role: string): role is TeamRole {
  return TEAM_ROLES.includes(role as TeamRole);
}

/**
 * Validate if an invitation status is valid
 */
export function isValidInvitationStatus(status: string): status is InvitationStatus {
  return INVITATION_STATUSES.includes(status as InvitationStatus);
}

/**
 * Validate if a member action is valid
 */
export function isValidMemberAction(action: string): action is MemberAction {
  return MEMBER_ACTIONS.includes(action as MemberAction);
}

/**
 * Validate email format (basic)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalize email address
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Validate invitation token format
 */
export function isValidInvitationToken(token: string): boolean {
  return typeof token === 'string' && token.length >= 32;
}

// ============================================================================
// PERMISSION CHECKING UTILITIES
// ============================================================================

/**
 * Check if a role has permission to perform a specific action
 */
export function hasPermission(userRole: TeamRole, action: MemberAction): boolean {
  switch (action) {
    case 'invite':
      return ['owner', 'admin'].includes(userRole);
    case 'remove':
      return ['owner', 'admin'].includes(userRole);
    case 'change_role':
      return userRole === 'owner';
    case 'manage_invitations':
      return ['owner', 'admin'].includes(userRole);
    default:
      return false;
  }
}

/**
 * Check if user can invite members
 */
export function canInviteMembers(userRole: TeamRole): boolean {
  return hasPermission(userRole, 'invite');
}

/**
 * Check if user can remove members
 */
export function canRemoveMembers(userRole: TeamRole): boolean {
  return hasPermission(userRole, 'remove');
}

/**
 * Check if user can change roles
 */
export function canChangeRoles(userRole: TeamRole): boolean {
  return hasPermission(userRole, 'change_role');
}

/**
 * Check if user can manage invitations
 */
export function canManageInvitations(userRole: TeamRole): boolean {
  return hasPermission(userRole, 'manage_invitations');
}

/**
 * Check if user can remove a specific member based on roles
 */
export function canRemoveSpecificMember(userRole: TeamRole, targetRole: TeamRole): boolean {
  if (userRole === 'owner') {
    return targetRole !== 'owner'; // Owner can remove anyone except other owners
  }
  if (userRole === 'admin') {
    return targetRole === 'member'; // Admins can only remove members
  }
  return false; // Members can't remove anyone
}

/**
 * Check if user can change a specific member's role
 */
export function canChangeSpecificRole(userRole: TeamRole, targetRole: TeamRole): boolean {
  return userRole === 'owner' && targetRole !== 'owner'; // Only owners can change roles, can't change owner role
}

/**
 * Check if a role change is valid
 */
export function isValidRoleChange(fromRole: TeamRole, toRole: TeamRole, changerRole: TeamRole): boolean {
  // Only owners can change roles
  if (changerRole !== 'owner') {
    return false;
  }
  
  // Can't change owner role
  if (fromRole === 'owner' || toRole === 'owner') {
    return false;
  }
  
  // Valid role change between admin and member
  return (fromRole === 'admin' && toRole === 'member') || 
         (fromRole === 'member' && toRole === 'admin');
}

// ============================================================================
// ROLE HIERARCHY AND COMPARISON
// ============================================================================

/**
 * Get role hierarchy weight (higher number = more permissions)
 */
export function getRoleWeight(role: TeamRole): number {
  switch (role) {
    case 'owner': return 3;
    case 'admin': return 2;
    case 'member': return 1;
    default: return 0;
  }
}

/**
 * Compare roles by hierarchy
 */
export function compareRoles(role1: TeamRole, role2: TeamRole): number {
  return getRoleWeight(role1) - getRoleWeight(role2);
}

/**
 * Check if role1 has higher permissions than role2
 */
export function hasHigherRole(role1: TeamRole, role2: TeamRole): boolean {
  return getRoleWeight(role1) > getRoleWeight(role2);
}

/**
 * Sort members by role hierarchy
 */
export function sortMembersByRole(members: TeamMember[]): TeamMember[] {
  return [...members].sort((a, b) => getRoleWeight(b.role) - getRoleWeight(a.role));
}

// ============================================================================
// INVITATION UTILITIES
// ============================================================================

/**
 * Check if invitation is expired
 */
export function isInvitationExpired(invitation: TeamInvitation): boolean {
  const expiryDate = typeof invitation.expires_at === 'string' 
    ? new Date(invitation.expires_at) 
    : invitation.expires_at;
  return new Date() > expiryDate;
}

/**
 * Check if invitation is pending and not expired
 */
export function isInvitationValid(invitation: TeamInvitation): boolean {
  return invitation.status === 'pending' && !isInvitationExpired(invitation);
}

/**
 * Calculate invitation expiry date
 */
export function calculateInvitationExpiry(days: number = DEFAULT_INVITATION_EXPIRY_DAYS): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

/**
 * Get invitation status display text
 */
export function getInvitationStatusText(invitation: TeamInvitation): string {
  if (invitation.status === 'pending' && isInvitationExpired(invitation)) {
    return 'Expired';
  }
  
  const statusMap: Record<InvitationStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted', 
    declined: 'Declined',
    cancelled: 'Cancelled',
    expired: 'Expired'
  };
  
  return statusMap[invitation.status] || 'Unknown';
}

/**
 * Get invitation status color class for UI
 */
export function getInvitationStatusColor(invitation: TeamInvitation): string {
  if (invitation.status === 'pending' && isInvitationExpired(invitation)) {
    return 'text-red-500';
  }
  
  const colorMap: Record<InvitationStatus, string> = {
    pending: 'text-yellow-500',
    accepted: 'text-green-500',
    declined: 'text-red-500',
    cancelled: 'text-gray-500',
    expired: 'text-red-500'
  };
  
  return colorMap[invitation.status] || 'text-gray-500';
}

// ============================================================================
// ROLE DISPLAY UTILITIES
// ============================================================================

/**
 * Get role display name
 */
export function getRoleDisplayName(role: TeamRole): string {
  switch (role) {
    case 'owner': return 'Owner';
    case 'admin': return 'Admin';
    case 'member': return 'Member';
    default: return 'Unknown';
  }
}

/**
 * Get role description
 */
export function getRoleDescription(role: TeamRole): string {
  switch (role) {
    case 'owner': 
      return 'Full access to all team features including billing and member management';
    case 'admin': 
      return 'Can invite members, manage PRDs, and access team settings';
    case 'member': 
      return 'Can create and edit PRDs, participate in team collaboration';
    default: 
      return 'Unknown role';
  }
}

/**
 * Get role badge color class for UI
 */
export function getRoleBadgeColor(role: TeamRole): string {
  switch (role) {
    case 'owner': return 'bg-purple-100 text-purple-800';
    case 'admin': return 'bg-blue-100 text-blue-800';
    case 'member': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// ============================================================================
// ACTIVITY UTILITIES
// ============================================================================

/**
 * Get activity action display text
 */
export function getActivityActionText(action: string): string {
  switch (action) {
    case 'invitation_sent': return 'Sent invitation';
    case 'invitation_resent': return 'Resent invitation';
    case 'invitation_cancelled': return 'Cancelled invitation';
    case 'member_removed': return 'Removed member';
    case 'role_changed': return 'Changed member role';
    case 'member_joined': return 'Joined team';
    default: return action.replace(/_/g, ' ');
  }
}

/**
 * Get activity icon for UI
 */
export function getActivityIcon(action: string): string {
  switch (action) {
    case 'invitation_sent': return '📧';
    case 'invitation_resent': return '🔄';
    case 'invitation_cancelled': return '❌';
    case 'member_removed': return '👋';
    case 'role_changed': return '🔄';
    case 'member_joined': return '👋';
    default: return '📝';
  }
}

/**
 * Format activity metadata for display
 */
export function formatActivityMetadata(action: string, metadata: Record<string, unknown>): string {
  switch (action) {
    case 'invitation_sent':
      return `to ${metadata.email} as ${metadata.role}`;
    case 'invitation_resent':
      return `to ${metadata.email}`;
    case 'invitation_cancelled':
      return `for ${metadata.email}`;
    case 'member_removed':
      return metadata.reason ? `(${metadata.reason})` : '';
    case 'role_changed':
      return `from ${metadata.old_role} to ${metadata.new_role}`;
    default:
      return '';
  }
}

// ============================================================================
// MEMBER STATISTICS UTILITIES
// ============================================================================

/**
 * Calculate member activity score based on various metrics
 */
export function calculateMemberActivityScore(member: TeamMember): number {
  const prdsWeight = 2;
  const editsWeight = 1;
  const commentsWeight = 0.5;
  
  return (member.total_prds_created * prdsWeight) + 
         (member.total_prds_edited * editsWeight) + 
         (member.total_comments * commentsWeight);
}

/**
 * Get member activity level based on score
 */
export function getMemberActivityLevel(member: TeamMember): 'high' | 'medium' | 'low' {
  const score = calculateMemberActivityScore(member);
  
  if (score >= 20) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

/**
 * Get member activity level color for UI
 */
export function getMemberActivityLevelColor(member: TeamMember): string {
  const level = getMemberActivityLevel(member);
  
  switch (level) {
    case 'high': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-gray-600';
    default: return 'text-gray-600';
  }
}

/**
 * Filter active members
 */
export function filterActiveMembers(members: TeamMember[]): TeamMember[] {
  return members.filter(member => member.is_active);
}

/**
 * Filter members by role
 */
export function filterMembersByRole(members: TeamMember[], role: TeamRole): TeamMember[] {
  return members.filter(member => member.role === role);
}

/**
 * Get team member statistics
 */
export function getTeamMemberStats(members: TeamMember[]): {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<TeamRole, number>;
} {
  const active = filterActiveMembers(members);
  
  return {
    total: members.length,
    active: active.length,
    inactive: members.length - active.length,
    byRole: {
      owner: filterMembersByRole(active, 'owner').length,
      admin: filterMembersByRole(active, 'admin').length,
      member: filterMembersByRole(active, 'member').length
    }
  };
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Create standard permission error message
 */
export function createPermissionErrorMessage(action: MemberAction): string {
  switch (action) {
    case 'invite':
      return 'You do not have permission to invite members';
    case 'remove':
      return 'You do not have permission to remove members';
    case 'change_role':
      return 'You do not have permission to change member roles';
    case 'manage_invitations':
      return 'You do not have permission to manage invitations';
    default:
      return 'You do not have permission to perform this action';
  }
}

/**
 * Create standard validation error messages
 */
export function createValidationErrorMessage(field: string, value: unknown): string {
  switch (field) {
    case 'email':
      return `Invalid email address: ${value}`;
    case 'role':
      return `Invalid role: ${value}. Must be one of: ${TEAM_ROLES.join(', ')}`;
    case 'token':
      return 'Invalid invitation token';
    default:
      return `Invalid ${field}: ${value}`;
  }
}
