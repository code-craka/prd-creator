import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001'),
  
  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_NAME: process.env.DB_NAME || 'prd_creator_dev',
  DB_USER: process.env.DB_USER || 'prd_creator_dev',
  DB_PASSWORD: process.env.DB_PASSWORD || 'prd_creator_dev',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // External APIs
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  
  // URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  
  // Features
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  ENABLE_EMAIL: process.env.ENABLE_EMAIL === 'true',
} as const;

// Validation
const requiredEnvVars = ['JWT_SECRET'] as const;

for (const envVar of requiredEnvVars) {
  if (!env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}