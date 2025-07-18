import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // First create the enum type
  await knex.raw(`
    CREATE TYPE team_member_role AS ENUM ('owner', 'admin', 'member');
  `);
  
  await knex.schema.createTable('team_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('role', 'team_member_role').notNullable().defaultTo('member');
    table.uuid('invited_by').references('id').inTable('users');
    table.timestamp('joined_at');
    table.timestamps(true, true);
    
    // Unique constraint
    table.unique(['team_id', 'user_id']);
    
    // Indexes
    table.index(['team_id']);
    table.index(['user_id']);
    table.index(['team_id', 'role']);
  });
  
  // Add trigger for updated_at
  await knex.raw(`
    CREATE TRIGGER update_team_members_updated_at 
    BEFORE UPDATE ON team_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members');
  await knex.schema.dropTableIfExists('team_members');
  await knex.raw('DROP TYPE IF EXISTS team_member_role');
}