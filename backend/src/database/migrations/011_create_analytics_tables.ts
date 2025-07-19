import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create analytics events table
  await knex.schema.createTable('analytics_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('team_id').nullable().references('id').inTable('teams').onDelete('CASCADE');
    table.uuid('prd_id').nullable().references('id').inTable('prds').onDelete('CASCADE');
    table.string('event_type').notNullable(); // 'prd_created', 'prd_viewed', 'prd_edited', 'comment_added', etc.
    table.string('event_category').notNullable(); // 'prd', 'team', 'user', 'collaboration'
    table.jsonb('event_data').defaultTo('{}'); // Additional event metadata
    table.string('session_id').nullable();
    table.string('ip_address').nullable();
    table.string('user_agent').nullable();
    table.timestamps(true, true);

    // Indexes for analytics queries
    table.index(['event_type', 'created_at']);
    table.index(['event_category', 'created_at']);
    table.index(['user_id', 'created_at']);
    table.index(['team_id', 'created_at']);
    table.index(['prd_id', 'created_at']);
    table.index(['created_at']);
  });

  // Create team analytics summary table
  await knex.schema.createTable('team_analytics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
    table.date('date').notNullable();
    table.integer('prds_created').defaultTo(0);
    table.integer('prds_edited').defaultTo(0);
    table.integer('comments_added').defaultTo(0);
    table.integer('active_users').defaultTo(0);
    table.integer('collaboration_sessions').defaultTo(0);
    table.decimal('avg_session_duration', 10, 2).defaultTo(0);
    table.jsonb('popular_templates').defaultTo('[]');
    table.timestamps(true, true);

    // Unique constraint for team per date
    table.unique(['team_id', 'date']);
    table.index(['team_id', 'date']);
  });

  // Create user activity summary table
  await knex.schema.createTable('user_activity', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('team_id').nullable().references('id').inTable('teams').onDelete('CASCADE');
    table.date('date').notNullable();
    table.integer('prds_created').defaultTo(0);
    table.integer('prds_viewed').defaultTo(0);
    table.integer('prds_edited').defaultTo(0);
    table.integer('comments_made').defaultTo(0);
    table.integer('login_count').defaultTo(0);
    table.decimal('time_spent_minutes', 10, 2).defaultTo(0);
    table.timestamp('last_active_at').nullable();
    table.timestamps(true, true);

    // Unique constraint for user per date per team
    table.unique(['user_id', 'team_id', 'date']);
    table.index(['user_id', 'date']);
    table.index(['team_id', 'date']);
  });

  // Create PRD analytics table
  await knex.schema.createTable('prd_analytics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('prd_id').notNullable().references('id').inTable('prds').onDelete('CASCADE');
    table.integer('view_count').defaultTo(0);
    table.integer('edit_count').defaultTo(0);
    table.integer('comment_count').defaultTo(0);
    table.integer('collaboration_sessions').defaultTo(0);
    table.decimal('avg_completion_time', 10, 2).nullable(); // Time to complete in hours
    table.integer('ai_generations_used').defaultTo(0);
    table.jsonb('template_usage').defaultTo('{}');
    table.timestamp('first_viewed_at').nullable();
    table.timestamp('last_edited_at').nullable();
    table.timestamps(true, true);

    // Unique constraint for PRD
    table.unique(['prd_id']);
    table.index(['prd_id']);
  });

  // Create template usage analytics
  await knex.schema.createTable('template_analytics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('template_name').notNullable();
    table.string('template_type').notNullable(); // 'feature', 'product', 'api', etc.
    table.uuid('team_id').nullable().references('id').inTable('teams').onDelete('CASCADE');
    table.integer('usage_count').defaultTo(0);
    table.date('date').notNullable();
    table.timestamps(true, true);

    // Indexes
    table.index(['template_name', 'date']);
    table.index(['template_type', 'date']);
    table.index(['team_id', 'date']);
    table.unique(['template_name', 'team_id', 'date']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('template_analytics');
  await knex.schema.dropTable('prd_analytics');
  await knex.schema.dropTable('user_activity');
  await knex.schema.dropTable('team_analytics');
  await knex.schema.dropTable('analytics_events');
}