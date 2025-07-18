import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add the foreign key constraint from users to teams that was missing in the initial users migration
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('current_team_id');
  });
  
  await knex.schema.alterTable('users', (table) => {
    table.uuid('current_team_id').references('id').inTable('teams').onDelete('SET NULL');
    table.index(['current_team_id']);
  });
  
  // Add analytics table for tracking events
  await knex.schema.createTable('analytics_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('team_id').references('id').inTable('teams').onDelete('CASCADE');
    table.string('event_type', 100).notNullable();
    table.jsonb('properties').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes for analytics queries
    table.index(['event_type', 'created_at']);
    table.index(['user_id', 'created_at']);
    table.index(['team_id', 'created_at']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('analytics_events');
  
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('current_team_id');
  });
  
  await knex.schema.alterTable('users', (table) => {
    table.uuid('current_team_id');
  });
}