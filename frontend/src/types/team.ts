export interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  description?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  role?: string; // User's role in this team
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  invited_by?: string;
  joined_at?: string;
  last_active_at?: string;
  total_prds_created: number;
  total_prds_edited: number;
  total_comments: number;
  is_active: boolean;
  deactivated_at?: string;
  deactivated_by?: string;
  created_at: string;
  updated_at: string;
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
  expires_at: string;
  accepted_at?: string;
  declined_at?: string;
  cancelled_at?: string;
  message?: string;
  created_at: string;
  updated_at: string;
  invited_by_name?: string;
  invited_by_email?: string;
}

export interface MemberActivityLog {
  id: string;
  team_id: string;
  user_id: string;
  action: string;
  metadata?: any;
  target_resource_id?: string;
  target_resource_type?: string;
  created_at: string;
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
  changed_at: string;
  changed_by_name?: string;
  user_name?: string;
}

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