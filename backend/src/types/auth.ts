import { Request } from 'express';
import { User } from 'prd-creator-shared';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

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