import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).unique().notNullable();
    table.string('name', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('avatar_url', 500);
    table.uuid('current_team_id').references('id').inTable('teams');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['email']);
    table.index(['created_at']);
  });
  
  // Add trigger for updated_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);
  
  await knex.raw(`
    CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_users_updated_at ON users');
  await knex.schema.dropTableIfExists('users');
}