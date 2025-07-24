import { api, apiCall, ApiResponse } from './api';
import { 
  TeamMember, 
  TeamInvitation, 
  MemberActivityLog, 
  RoleChangeHistory,
  TeamInviteRequest,
  UpdateMemberRoleRequest,
  RemoveMemberRequest,
  // Import shared utilities
  canInviteMembers,
  canRemoveMembers,
  canChangeRoles,
  canRemoveSpecificMember,
  canChangeSpecificRole
} from 'prd-creator-shared';

export const memberService = {
  // Invitation Management
  async createInvitation(teamId: string, data: TeamInviteRequest): Promise<TeamInvitation> {
    const response = await apiCall(() => 
      api.post<ApiResponse<{ invitation: TeamInvitation }>>(`/teams/${teamId}/invitations`, data)
    );
    return response.invitation;
  },

  async getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
    const response = await apiCall(() => 
      api.get<ApiResponse<{ invitations: TeamInvitation[] }>>(`/teams/${teamId}/invitations`)
    );
    return response.invitations;
  },

  async resendInvitation(teamId: string, invitationId: string): Promise<void> {
    return apiCall(() => 
      api.post<ApiResponse>(`/teams/${teamId}/invitations/${invitationId}/resend`)
    );
  },

  async cancelInvitation(teamId: string, invitationId: string): Promise<void> {
    return apiCall(() => 
      api.delete<ApiResponse>(`/teams/${teamId}/invitations/${invitationId}`)
    );
  },

  async acceptInvitation(token: string): Promise<{ teamId: string }> {
    const response = await apiCall(() => 
      api.post<ApiResponse<{ teamId: string }>>(`/invitations/accept/${token}`)
    );
    return response;
  },

  // Enhanced Member Management
  async getTeamMembersWithActivity(teamId: string): Promise<TeamMember[]> {
    const response = await apiCall(() => 
      api.get<ApiResponse<{ members: TeamMember[] }>>(`/teams/${teamId}/members`)
    );
    return response.members;
  },

  async updateMemberRole(
    teamId: string, 
    memberId: string, 
    data: UpdateMemberRoleRequest
  ): Promise<void> {
    return apiCall(() => 
      api.put<ApiResponse>(`/teams/${teamId}/members/${memberId}/role`, data)
    );
  },

  async removeMember(
    teamId: string, 
    memberId: string, 
    data?: RemoveMemberRequest
  ): Promise<void> {
    return apiCall(() => 
      api.delete<ApiResponse>(`/teams/${teamId}/members/${memberId}`, { data })
    );
  },

  // Activity and Analytics
  async getMemberActivity(teamId: string, limit = 50): Promise<MemberActivityLog[]> {
    const response = await apiCall(() => 
      api.get<ApiResponse<{ activities: MemberActivityLog[] }>>(
        `/teams/${teamId}/activity?limit=${limit}`
      )
    );
    return response.activities;
  },

  async getRoleChangeHistory(teamId: string): Promise<RoleChangeHistory[]> {
    const response = await apiCall(() => 
      api.get<ApiResponse<{ history: RoleChangeHistory[] }>>(`/teams/${teamId}/role-history`)
    );
    return response.history;
  },

  // Permission Helpers (re-exported from shared service for convenience)
  canInviteMembers,
  canRemoveMembers, 
  canChangeRoles,
  canRemoveSpecificMember,
  canChangeSpecificRole,
};