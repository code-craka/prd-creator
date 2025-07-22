import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('prd_comments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('prd_id').notNullable().references('id').inTable('prds').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('section').notNullable();
    table.integer('position').notNullable();
    table.text('content').notNullable();
    table.boolean('resolved').defaultTo(false);
    table.uuid('parent_id').nullable().references('id').inTable('prd_comments').onDelete('CASCADE');
    table.timestamps(true, true);

    // Indexes
    table.index(['prd_id', 'section']);
    table.index(['prd_id', 'resolved']);
    table.index(['user_id']);
    table.index(['parent_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('prd_comments');
}