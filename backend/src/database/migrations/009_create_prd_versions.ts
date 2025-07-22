import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('prd_versions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('prd_id').notNullable().references('id').inTable('prds').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('version_number').notNullable();
    table.text('content').notNullable();
    table.text('change_summary').nullable();
    table.jsonb('metadata').defaultTo('{}');
    table.boolean('is_major_version').defaultTo(false);
    table.timestamps(true, true);

    // Indexes
    table.index(['prd_id', 'version_number']);
    table.index(['prd_id', 'created_at']);
    table.index(['user_id']);
    
    // Unique constraint for version numbers per PRD
    table.unique(['prd_id', 'version_number']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('prd_versions');
}