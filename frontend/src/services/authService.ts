import { api, apiCall, ApiResponse } from './api';
import { User } from 'prd-creator-shared';

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

export interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

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