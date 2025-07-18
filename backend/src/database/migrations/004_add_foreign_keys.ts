import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add foreign key constraint from users to teams
  await knex.schema.alterTable('users', (table) => {
    table.foreign('current_team_id').references('id').inTable('teams').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove foreign key constraint
  await knex.schema.alterTable('users', (table) => {
    table.dropForeign(['current_team_id']);
  });
}