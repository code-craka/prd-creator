import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// JWT utilities
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_SECRET as string, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, env.JWT_SECRET as string);
};

// Slug generation
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
};

// Random token generation
export const generateShareToken = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

export const generateInviteToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Date utilities
export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const formatDate = (date: Date): string => {
  return date.toISOString();
};

// Safe parsing utilities
export const safeParseInt = (value: string | number | undefined | null, defaultValue = 0): number => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  const stringValue = String(value).trim();
  if (stringValue === '') {
    return defaultValue;
  }
  
  const parsed = parseInt(stringValue, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const safeParseFloat = (value: string | number | undefined | null, defaultValue = 0): number => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  const stringValue = String(value).trim();
  if (stringValue === '') {
    return defaultValue;
  }
  
  const parsed = parseFloat(stringValue);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const safeParsePositiveInt = (value: string | number | undefined | null, defaultValue = 1): number => {
  const parsed = safeParseInt(value, defaultValue);
  return Math.max(1, parsed);
};

// Pagination utilities
export const getPaginationInfo = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    total,
    pages: totalPages,
    hasNext: hasNextPage,
    hasPrev: hasPrevPage,
  };
};

// Email utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  const maskedUsername = username.length > 2 
    ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
    : username;
  return `${maskedUsername}@${domain}`;
};

// Text utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

export const sanitizeHTML = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// Array utilities
export const removeDuplicates = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Object utilities
export const pickFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): Partial<T> => {
  const result: Partial<T> = {};
  fields.forEach(field => {
    if (field in obj) {
      result[field] = obj[field];
    }
  });
  return result;
};

export const omitFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): Partial<T> => {
  const result = { ...obj };
  fields.forEach(field => {
    delete result[field];
  });
  return result;
};

// Async utilities
export const asyncWrapper = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};