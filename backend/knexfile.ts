import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'prd_creator_dev',
      user: process.env.DB_USER || 'prd_creator_dev',
      password: process.env.DB_PASSWORD || 'prd_creator_dev'
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts'
    },
    seeds: {
      directory: './src/database/seeds',
      extension: 'ts'
    },
    pool: {
      min: 2,
      max: 10
    }
  },
  
  test: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME_TEST || 'prd_creator_test',
      user: process.env.DB_USER || 'prd_creator_test',
      password: process.env.DB_PASSWORD || 'prd_creator_test'
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts'
    },
    pool: {
      min: 1,
      max: 5
    }
  },
  
  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts'
    },
    pool: {
      min: 2,
      max: 20
    }
  }
};

export default config;