// Team and Member related types and interfaces
export interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  description?: string;
  avatar_url?: string;
  created_at: Date | string;
  updated_at: Date | string;
  role?: string; // User's role in this team
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  invited_by?: string;
  joined_at?: Date | string;
  last_active_at?: Date | string;
  total_prds_created: number;
  total_prds_edited: number;
  total_comments: number;
  is_active: boolean;
  deactivated_at?: Date | string;
  deactivated_by?: string;
  created_at: Date | string;
  updated_at: Date | string;
  // User fields (when joined with user data)
  name?: string;
  email?: string;
  avatar_url?: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  token: string;
  expires_at: Date | string;
  accepted_at?: Date | string;
  declined_at?: Date | string;
  cancelled_at?: Date | string;
  message?: string;
  created_at: Date | string;
  updated_at: Date | string;
  // Extended fields (when joined with user data)
  invited_by_name?: string;
  invited_by_email?: string;
}

export interface MemberActivityLog {
  id: string;
  team_id: string;
  user_id: string;
  action: string;
  metadata?: Record<string, unknown>;
  target_resource_id?: string;
  target_resource_type?: string;
  created_at: Date | string;
  // Extended fields (when joined with user data)
  user_name?: string;
  user_email?: string;
}

export interface RoleChangeHistory {
  id: string;
  team_id: string;
  user_id: string;
  old_role?: 'owner' | 'admin' | 'member';
  new_role: 'owner' | 'admin' | 'member';
  changed_by: string;
  reason?: string;
  changed_at: Date | string;
  // Extended fields (when joined with user data)
  changed_by_name?: string;
  user_name?: string;
}

// Request/Response types
export interface CreateTeamRequest {
  name: string;
}

export interface TeamInviteRequest {
  email: string;
  role?: 'admin' | 'member';
  message?: string;
}

export interface UpdateMemberRoleRequest {
  role: 'admin' | 'member';
  reason?: string;
}

export interface RemoveMemberRequest {
  reason?: string;
}

export interface TeamFilters {
  search?: string;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  avatar_url?: string;
}

export interface TeamSettings {
  team: Team;
  memberCount: number;
  createdAt: string;
  ownerName: string;
}

export interface TransferOwnershipRequest {
  newOwnerId: string;
  reason?: string;
}

export interface DeleteTeamRequest {
  confirmName: string;
  reason?: string;
}

// Member service specific types
export interface MemberPermissionContext {
  teamId: string;
  userId: string;
  action: 'invite' | 'remove' | 'change_role' | 'manage_invitations';
}

export interface InvitationContext {
  email: string;
  role: 'admin' | 'member';
  teamId: string;
  invitedBy: string;
  message?: string;
}

export interface MemberRoleUpdateContext {
  teamId: string;
  userId: string;
  targetUserId: string;
  newRole: 'admin' | 'member';
  reason?: string;
}
