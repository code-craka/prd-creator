import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('teams', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('slug', 100).unique().notNullable();
    table.uuid('owner_id').notNullable().references('id').inTable('users');
    table.text('description');
    table.string('avatar_url', 500);
    table.jsonb('settings').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['slug']);
    table.index(['owner_id']);
    table.index(['created_at']);
  });
  
  // Add trigger for updated_at
  await knex.raw(`
    CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_teams_updated_at ON teams');
  await knex.schema.dropTableIfExists('teams');
}