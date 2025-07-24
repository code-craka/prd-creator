import { api, apiCall, ApiResponse } from './api';
import { 
  PRD, 
  CreatePRDRequest, 
  PRDFilters, 
  PaginatedResponse,
  buildPRDQueryParams 
} from 'prd-creator-shared';

export interface PRDWithAuthor extends PRD {
  author_name: string;
  author_avatar?: string;
}

export const prdService = {
  async createPRD(data: CreatePRDRequest): Promise<PRD> {
    return apiCall(() => api.post<ApiResponse<PRD>>('/prds', data));
  },

  async getUserPRDs(filters: PRDFilters = {}): Promise<PaginatedResponse<PRD>> {
    const params = buildPRDQueryParams(filters);

    return apiCall(() => 
      api.get<ApiResponse<PaginatedResponse<PRD>>>(`/prds?${params.toString()}`)
    );
  },

  async getPublicPRDs(filters: PRDFilters = {}): Promise<PaginatedResponse<PRDWithAuthor>> {
    const params = buildPRDQueryParams(filters);

    return apiCall(() => 
      api.get<ApiResponse<PaginatedResponse<PRDWithAuthor>>>(`/prds/public?${params.toString()}`)
    );
  },

  async getPRD(id: string): Promise<PRD> {
    return apiCall(() => api.get<ApiResponse<PRD>>(`/prds/${id}`));
  },

  async updatePRD(id: string, data: Partial<CreatePRDRequest>): Promise<PRD> {
    return apiCall(() => api.put<ApiResponse<PRD>>(`/prds/${id}`, data));
  },

  async deletePRD(id: string): Promise<void> {
    return apiCall(() => api.delete<ApiResponse>(`/prds/${id}`));
  },

  async sharePRDWithTeam(id: string): Promise<void> {
    return apiCall(() => api.post<ApiResponse>(`/prds/${id}/share-team`));
  },

  async createPublicShareLink(id: string): Promise<{ shareToken: string; shareUrl: string }> {
    return apiCall(() => 
      api.post<ApiResponse<{ shareToken: string; shareUrl: string }>>(`/prds/${id}/share-public`)
    );
  },

  async getSharedPRD(token: string): Promise<PRDWithAuthor> {
    const response = await apiCall(() => api.get<ApiResponse<{ prd: PRDWithAuthor }>>(`/prds/shared/${token}`));
    return response.prd;
  },

  async getTeamPRDs(teamId: string, filters: PRDFilters = {}): Promise<PaginatedResponse<PRDWithAuthor>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    return apiCall(() => 
      api.get<ApiResponse<PaginatedResponse<PRDWithAuthor>>>(`/teams/${teamId}/prds?${params.toString()}`)
    );
  },
};