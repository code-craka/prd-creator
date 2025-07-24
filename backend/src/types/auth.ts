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