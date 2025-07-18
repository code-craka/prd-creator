import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create enum type for visibility
  await knex.raw(`
    CREATE TYPE prd_visibility AS ENUM ('private', 'team', 'public');
  `);
  
  await knex.schema.createTable('prds', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.uuid('team_id').references('id').inTable('teams').onDelete('SET NULL');
    table.string('title', 500).notNullable();
    table.text('content').notNullable();
    table.jsonb('metadata').defaultTo('{}');
    table.specificType('visibility', 'prd_visibility').notNullable().defaultTo('private');
    table.string('share_token', 32).unique();
    table.uuid('template_id').references('id').inTable('templates');
    table.integer('view_count').defaultTo(0);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['user_id', 'created_at']);
    table.index(['team_id', 'visibility', 'updated_at']);
    table.index(['share_token']);
    table.index(['template_id']);
    table.index(['visibility', 'created_at']);
    table.index(['title']);
  });
  
  // Add trigger for updated_at
  await knex.raw(`
    CREATE TRIGGER update_prds_updated_at 
    BEFORE UPDATE ON prds 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  
  // Add full text search index for content
  await knex.raw(`
    CREATE INDEX idx_prds_content_search ON prds 
    USING GIN (to_tsvector('english', title || ' ' || content));
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_prds_updated_at ON prds');
  await knex.schema.dropTableIfExists('prds');
  await knex.raw('DROP TYPE IF EXISTS prd_visibility');
}