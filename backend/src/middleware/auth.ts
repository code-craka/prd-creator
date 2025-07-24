import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { db } from '../config/database';
import { UnauthorizedError } from './errorHandler';
import { AuthenticatedRequest as SharedAuthRequest, JWTPayload, User } from 'prd-creator-shared';

// Create a backend-specific authenticated request interface
export interface BackendAuthenticatedRequest extends Request {
  user: User;
  teamId?: string;
}

// Re-export the shared interface for backward compatibility
export type { SharedAuthRequest as AuthenticatedRequest };

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify JWT
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    
    if (!decoded.userId) {
      throw new UnauthorizedError('Invalid token format');
    }

    // Get user from database
    const user = await db('users')
      .where('id', decoded.userId)
      .select('id', 'email', 'name', 'current_team_id')
      .first();

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Attach user to request
    (req as BackendAuthenticatedRequest).user = user;
    
    // Attach team ID from header if provided
    const teamIdHeader = req.headers['x-team-id'] as string;
    if (teamIdHeader) {
      (req as BackendAuthenticatedRequest).teamId = teamIdHeader;
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
        
        if (decoded.userId) {
          const user = await db('users')
            .where('id', decoded.userId)
            .select('id', 'email', 'name', 'current_team_id')
            .first();

          if (user) {
            (req as BackendAuthenticatedRequest).user = user;
          }
        }
      }
    }

    next();
  } catch (error) {
    // For optional auth, we ignore token errors and continue without user
    next();
  }
};