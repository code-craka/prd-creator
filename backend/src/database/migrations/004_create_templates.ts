import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('team_id').references('id').inTable('teams').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description');
    table.jsonb('structure').notNullable();
    table.string('industry', 100);
    table.boolean('is_public').defaultTo(false);
    table.integer('usage_count').defaultTo(0);
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['team_id']);
    table.index(['industry']);
    table.index(['is_public']);
    table.index(['usage_count']);
    table.index(['created_by']);
    table.index(['created_at']);
  });
  
  // Add trigger for updated_at
  await knex.raw(`
    CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_templates_updated_at ON templates');
  await knex.schema.dropTableIfExists('templates');
}