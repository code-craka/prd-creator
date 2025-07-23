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

// Clean up database between tests using a more efficient approach
afterEach(async () => {
  try {
    // Disable foreign key checks temporarily and truncate in dependency order
    await db.raw('SET session_replication_role = replica');
    
    // Get all tables except system tables
    const tables = await db.raw(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'knex_migrations' 
      AND tablename != 'knex_migrations_lock'
      ORDER BY tablename
    `);
    
    // Truncate all tables in a single transaction
    await db.transaction(async (trx) => {
      for (const table of tables.rows) {
        await trx.raw(`TRUNCATE TABLE "${table.tablename}" RESTART IDENTITY CASCADE`);
      }
    });
    
    // Re-enable foreign key checks
    await db.raw('SET session_replication_role = DEFAULT');
  } catch (error) {
    console.error('Database cleanup failed:', error);
    // Try alternative cleanup approach
    await db.raw('TRUNCATE TABLE team_members, team_invitations, prds, teams, users RESTART IDENTITY CASCADE');
  }
});

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DB_NAME = 'prd_creator_test';