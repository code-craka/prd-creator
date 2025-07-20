import { db } from '../config/database';

// Global test setup
beforeAll(async () => {
  // Run migrations for test database
  try {
    await db.migrate.latest();
  } catch (error) {
    console.error('Migration failed:', error);
  }
});

afterAll(async () => {
  // Clean up database connection
  await db.destroy();
});

// Clean up database between tests
afterEach(async () => {
  // Truncate all tables except migrations
  const tables = await db.raw(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename != 'knex_migrations' 
    AND tablename != 'knex_migrations_lock'
  `);
  
  for (const table of tables.rows) {
    await db.raw(`TRUNCATE TABLE "${table.tablename}" RESTART IDENTITY CASCADE`);
  }
});

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DB_NAME = 'prd_creator_test';