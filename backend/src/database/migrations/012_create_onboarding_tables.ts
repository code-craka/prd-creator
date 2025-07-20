import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // User onboarding progress tracking
  await knex.schema.createTable('user_onboarding', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
    table.boolean('welcome_completed').defaultTo(false);
    table.boolean('profile_setup_completed').defaultTo(false);
    table.boolean('first_prd_created').defaultTo(false);
    table.boolean('team_invitation_sent').defaultTo(false);
    table.boolean('tutorial_completed').defaultTo(false);
    table.jsonb('tutorial_progress').defaultTo('{}'); // Track individual tutorial steps
    table.string('company_type').nullable(); // 'startup', 'enterprise', 'agency', 'freelancer'
    table.string('industry').nullable(); // 'tech', 'healthcare', 'finance', 'retail', etc.
    table.string('team_size').nullable(); // 'solo', 'small', 'medium', 'large'
    table.string('experience_level').nullable(); // 'beginner', 'intermediate', 'expert'
    table.jsonb('preferences').defaultTo('{}'); // User preferences and settings
    table.integer('completion_percentage').defaultTo(0);
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
    table.timestamps(true, true);

    // Indexes
    table.index(['user_id']);
    table.index(['company_type', 'industry']);
    table.index(['completion_percentage']);
  });

  // Industry-specific PRD templates
  await knex.schema.createTable('prd_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description').notNullable();
    table.string('category').notNullable(); // 'feature', 'product', 'api', 'mobile', 'web'
    table.string('industry').notNullable(); // 'tech', 'healthcare', 'finance', 'retail', etc.
    table.string('company_type').notNullable(); // 'startup', 'enterprise', 'agency'
    table.string('complexity_level').notNullable(); // 'basic', 'intermediate', 'advanced'
    table.jsonb('template_content').notNullable(); // Full PRD template structure
    table.jsonb('metadata').defaultTo('{}'); // Tags, keywords, estimated time
    table.boolean('is_featured').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.integer('usage_count').defaultTo(0);
    table.decimal('rating', 3, 2).defaultTo(0); // Average rating out of 5
    table.integer('rating_count').defaultTo(0);
    table.uuid('created_by').references('id').inTable('users').nullable();
    table.timestamps(true, true);

    // Indexes
    table.index(['category', 'industry']);
    table.index(['company_type', 'complexity_level']);
    table.index(['is_featured', 'is_active']);
    table.index(['usage_count']);
    table.index(['rating']);
  });

  // Template ratings and reviews
  await knex.schema.createTable('template_ratings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('template_id').references('id').inTable('prd_templates').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating').notNullable().checkBetween([1, 5]);
    table.text('review').nullable();
    table.timestamps(true, true);

    // Unique constraint: one rating per user per template
    table.unique(['template_id', 'user_id']);
    
    // Indexes
    table.index(['template_id']);
    table.index(['user_id']);
    table.index(['rating']);
  });

  // Onboarding tutorial steps
  await knex.schema.createTable('tutorial_steps', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('step_id').notNullable().unique(); // 'welcome', 'profile-setup', 'first-prd', etc.
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.jsonb('content').notNullable(); // Tutorial content, instructions, media
    table.integer('order_index').notNullable();
    table.string('category').notNullable(); // 'getting-started', 'advanced', 'collaboration'
    table.integer('estimated_time_minutes').defaultTo(5);
    table.jsonb('prerequisites').defaultTo('[]'); // Required previous steps
    table.boolean('is_required').defaultTo(true);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    // Indexes
    table.index(['category', 'order_index']);
    table.index(['is_required', 'is_active']);
  });

  // User tutorial progress tracking
  await knex.schema.createTable('user_tutorial_progress', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('step_id').references('id').inTable('tutorial_steps').onDelete('CASCADE');
    table.boolean('completed').defaultTo(false);
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
    table.integer('time_spent_seconds').defaultTo(0);
    table.jsonb('interaction_data').defaultTo('{}'); // Track user interactions
    table.timestamps(true, true);

    // Unique constraint: one progress record per user per step
    table.unique(['user_id', 'step_id']);
    
    // Indexes
    table.index(['user_id']);
    table.index(['step_id']);
    table.index(['completed']);
  });

  // Company and industry classifications
  await knex.schema.createTable('industry_classifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('industry_key').notNullable().unique();
    table.string('industry_name').notNullable();
    table.text('description').nullable();
    table.jsonb('typical_prd_types').defaultTo('[]'); // Common PRD types for this industry
    table.jsonb('recommended_templates').defaultTo('[]'); // Template IDs
    table.boolean('is_active').defaultTo(true);
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);

    // Indexes
    table.index(['industry_key']);
    table.index(['is_active', 'sort_order']);
  });

  // Company type classifications
  await knex.schema.createTable('company_type_classifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('type_key').notNullable().unique();
    table.string('type_name').notNullable();
    table.text('description').nullable();
    table.jsonb('characteristics').defaultTo('{}'); // Typical characteristics
    table.jsonb('recommended_features').defaultTo('[]'); // Recommended PRD Creator features
    table.boolean('is_active').defaultTo(true);
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);

    // Indexes
    table.index(['type_key']);
    table.index(['is_active', 'sort_order']);
  });

  // Onboarding analytics and metrics
  await knex.schema.createTable('onboarding_analytics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('event_type').notNullable(); // 'step_started', 'step_completed', 'tutorial_abandoned'
    table.string('event_category').notNullable(); // 'onboarding', 'tutorial', 'template_selection'
    table.string('step_id').nullable(); // Reference to tutorial step
    table.jsonb('event_data').defaultTo('{}'); // Additional event metadata
    table.integer('time_spent_seconds').defaultTo(0);
    table.string('user_agent').nullable();
    table.string('device_type').nullable(); // 'desktop', 'tablet', 'mobile'
    table.timestamps(true, true);

    // Indexes
    table.index(['user_id', 'event_type']);
    table.index(['event_category', 'created_at']);
    table.index(['step_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('onboarding_analytics');
  await knex.schema.dropTableIfExists('company_type_classifications');
  await knex.schema.dropTableIfExists('industry_classifications');
  await knex.schema.dropTableIfExists('user_tutorial_progress');
  await knex.schema.dropTableIfExists('tutorial_steps');
  await knex.schema.dropTableIfExists('template_ratings');
  await knex.schema.dropTableIfExists('prd_templates');
  await knex.schema.dropTableIfExists('user_onboarding');
}