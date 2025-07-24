import { api, apiCall, ApiResponse } from './api';
import { Team, TeamMember, CreateTeamRequest } from 'prd-creator-shared';

export interface TeamWithRole extends Team {
  role: string;
}

export interface InviteMemberRequest {
  email: string;
}

export interface UpdateMemberRoleRequest {
  role: 'owner' | 'admin' | 'member';
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  avatar_url?: string;
}

export interface DeleteTeamRequest {
  confirmName: string;
  reason?: string;
}

export interface TransferOwnershipRequest {
  newOwnerId: string;
  reason?: string;
}

export interface TeamSettings {
  team: Team;
  memberCount: number;
  ownerName: string;
  createdAt: string;
}

export const teamService = {
  async createTeam(data: CreateTeamRequest): Promise<Team> {
    const response = await apiCall(() => api.post<ApiResponse<{ team: Team }>>('/teams', data));
    return response.team;
  },

  async getUserTeams(): Promise<TeamWithRole[]> {
    const response = await apiCall(() => api.get<ApiResponse<{ teams: TeamWithRole[] }>>('/teams/my-teams'));
    return response.teams;
  },

  async switchTeam(teamId: string): Promise<Team> {
    const response = await apiCall(() => api.post<ApiResponse<{ team: Team }>>('/teams/switch', { teamId }));
    return response.team;
  },

  async getTeam(teamId: string): Promise<Team> {
    const response = await apiCall(() => api.get<ApiResponse<{ team: Team }>>(`/teams/${teamId}`));
    return response.team;
  },

  async updateTeam(teamId: string, data: UpdateTeamRequest): Promise<Team> {
    const response = await apiCall(() => api.put<ApiResponse<{ team: Team }>>(`/teams/${teamId}`, data));
    return response.team;
  },

  async deleteTeam(teamId: string): Promise<void> {
    return apiCall(() => api.delete<ApiResponse>(`/teams/${teamId}`));
  },

  async inviteMember(teamId: string, data: InviteMemberRequest): Promise<void> {
    return apiCall(() => api.post<ApiResponse>(`/teams/${teamId}/invite`, data));
  },

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const response = await apiCall(() => api.get<ApiResponse<{ members: TeamMember[] }>>(`/teams/${teamId}/members`));
    return response.members;
  },

  async updateMemberRole(teamId: string, memberId: string, data: UpdateMemberRoleRequest): Promise<void> {
    return apiCall(() => api.put<ApiResponse>(`/teams/${teamId}/members/${memberId}/role`, data));
  },

  async removeMember(teamId: string, memberId: string): Promise<void> {
    return apiCall(() => api.delete<ApiResponse>(`/teams/${teamId}/members/${memberId}`));
  },

  async deleteTeamWithReason(teamId: string, data: DeleteTeamRequest): Promise<void> {
    return apiCall(() => api.delete<ApiResponse>(`/teams/${teamId}`, { data }));
  },

  async transferOwnership(teamId: string, data: TransferOwnershipRequest): Promise<void> {
    return apiCall(() => api.post<ApiResponse>(`/teams/${teamId}/transfer-ownership`, data));
  },

  async getTeamSettings(teamId: string): Promise<TeamSettings> {
    const response = await apiCall(() => api.get<ApiResponse<TeamSettings>>(`/teams/${teamId}/settings`));
    return response;
  },
};