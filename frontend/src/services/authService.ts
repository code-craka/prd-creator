import { api, apiCall, ApiResponse } from './api';
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  UpdateProfileRequest, 
  ChangePasswordRequest 
} from 'prd-creator-shared';

// Re-export types for components
export type { LoginRequest, RegisterRequest, AuthResponse, UpdateProfileRequest, ChangePasswordRequest };

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    return apiCall(() => api.post<ApiResponse<AuthResponse>>('/auth/login', data));
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiCall(() => api.post<ApiResponse<AuthResponse>>('/auth/register', data));
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiCall(() => api.get<ApiResponse<{ user: User }>>('/auth/me'));
    return response.user;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await apiCall(() => api.put<ApiResponse<{ user: User }>>('/auth/profile', data));
    return response.user;
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return apiCall(() => api.post<ApiResponse>('/auth/change-password', data));
  },

  async logout(): Promise<void> {
    return apiCall(() => api.post<ApiResponse>('/auth/logout'));
  },
};