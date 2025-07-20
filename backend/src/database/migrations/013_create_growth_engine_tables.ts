import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Viral Growth Features
  
  // Public PRD Gallery
  await knex.schema.createTable('public_prds', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('prd_id').references('id').inTable('prds').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description').nullable();
    table.string('category').notNullable(); // 'featured', 'trending', 'community'
    table.jsonb('tags').defaultTo('[]');
    table.string('industry').notNullable();
    table.string('complexity_level').notNullable(); // 'beginner', 'intermediate', 'advanced'
    table.integer('view_count').defaultTo(0);
    table.integer('like_count').defaultTo(0);
    table.integer('share_count').defaultTo(0);
    table.integer('clone_count').defaultTo(0);
    table.boolean('is_featured').defaultTo(false);
    table.boolean('is_trending').defaultTo(false);
    table.string('featured_reason').nullable(); // Why it's featured
    table.timestamp('featured_until').nullable();
    table.jsonb('social_metrics').defaultTo('{}'); // Social sharing metrics
    table.string('seo_slug').unique().notNullable();
    table.text('seo_description').nullable();
    table.timestamps(true, true);
    
    table.index(['category', 'is_featured']);
    table.index(['industry', 'complexity_level']);
    table.index(['created_at', 'view_count']);
    table.index('seo_slug');
  });

  // Referral Program
  await knex.schema.createTable('referral_codes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('code').unique().notNullable();
    table.integer('uses_count').defaultTo(0);
    table.integer('max_uses').nullable();
    table.timestamp('expires_at').nullable();
    table.boolean('is_active').defaultTo(true);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    table.index('code');
    table.index(['user_id', 'is_active']);
  });

  await knex.schema.createTable('referrals', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('referrer_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('referred_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('referral_code_id').references('id').inTable('referral_codes').onDelete('SET NULL').nullable();
    table.string('status').defaultTo('pending'); // 'pending', 'converted', 'rewarded'
    table.timestamp('converted_at').nullable();
    table.timestamp('rewarded_at').nullable();
    table.jsonb('conversion_data').defaultTo('{}');
    table.timestamps(true, true);
    
    table.unique(['referrer_id', 'referred_id']);
    table.index(['referrer_id', 'status']);
    table.index('referred_id');
  });

  await knex.schema.createTable('referral_rewards', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('referral_id').references('id').inTable('referrals').onDelete('CASCADE');
    table.string('reward_type').notNullable(); // 'credits', 'subscription', 'feature_unlock'
    table.string('reward_value').notNullable();
    table.text('description').notNullable();
    table.boolean('is_claimed').defaultTo(false);
    table.timestamp('claimed_at').nullable();
    table.timestamp('expires_at').nullable();
    table.timestamps(true, true);
    
    table.index(['user_id', 'is_claimed']);
    table.index('referral_id');
  });

  // Content Marketing & SEO
  
  // Blog System
  await knex.schema.createTable('blog_posts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('author_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.string('slug').unique().notNullable();
    table.text('excerpt').notNullable();
    table.text('content').notNullable(); // Markdown content
    table.text('html_content').notNullable(); // Rendered HTML
    table.string('status').defaultTo('draft'); // 'draft', 'published', 'archived'
    table.string('category').notNullable();
    table.jsonb('tags').defaultTo('[]');
    table.string('featured_image_url').nullable();
    table.text('seo_title').nullable();
    table.text('seo_description').nullable();
    table.jsonb('seo_keywords').defaultTo('[]');
    table.integer('read_time_minutes').notNullable();
    table.integer('view_count').defaultTo(0);
    table.integer('share_count').defaultTo(0);
    table.timestamp('published_at').nullable();
    table.timestamps(true, true);
    
    table.index(['status', 'published_at']);
    table.index(['category', 'published_at']);
    table.index('slug');
  });

  // Case Studies
  await knex.schema.createTable('case_studies', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('team_id').references('id').inTable('teams').onDelete('CASCADE').nullable();
    table.uuid('prd_id').references('id').inTable('prds').onDelete('CASCADE').nullable();
    table.string('title').notNullable();
    table.string('slug').unique().notNullable();
    table.text('summary').notNullable();
    table.text('challenge').notNullable();
    table.text('solution').notNullable();
    table.text('results').notNullable();
    table.jsonb('metrics').defaultTo('{}'); // Success metrics
    table.string('industry').notNullable();
    table.string('company_size').notNullable();
    table.string('status').defaultTo('draft'); // 'draft', 'published', 'featured'
    table.string('featured_image_url').nullable();
    table.jsonb('tags').defaultTo('[]');
    table.text('seo_title').nullable();
    table.text('seo_description').nullable();
    table.integer('view_count').defaultTo(0);
    table.boolean('is_featured').defaultTo(false);
    table.timestamp('published_at').nullable();
    table.timestamps(true, true);
    
    table.index(['status', 'published_at']);
    table.index(['industry', 'is_featured']);
    table.index('slug');
  });

  // Template Marketplace
  await knex.schema.createTable('marketplace_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('template_id').references('id').inTable('prd_templates').onDelete('CASCADE');
    table.uuid('creator_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('status').defaultTo('pending'); // 'pending', 'approved', 'featured', 'rejected'
    table.decimal('price', 10, 2).defaultTo(0); // Free or paid templates
    table.string('license_type').notNullable(); // 'free', 'commercial', 'premium'
    table.integer('download_count').defaultTo(0);
    table.integer('purchase_count').defaultTo(0);
    table.decimal('rating_average', 3, 2).defaultTo(0);
    table.integer('rating_count').defaultTo(0);
    table.boolean('is_featured').defaultTo(false);
    table.timestamp('featured_until').nullable();
    table.jsonb('preview_images').defaultTo('[]');
    table.text('seo_description').nullable();
    table.timestamps(true, true);
    
    table.index(['status', 'is_featured']);
    table.index(['creator_id', 'status']);
    table.index('rating_average');
  });

  // Conversion Optimization
  
  // Landing Page A/B Testing
  await knex.schema.createTable('landing_page_variants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('page_name').notNullable(); // 'homepage', 'pricing', 'signup'
    table.string('variant_name').notNullable(); // 'control', 'variant_a', 'variant_b'
    table.jsonb('content_config').defaultTo('{}'); // Page content configuration
    table.jsonb('style_config').defaultTo('{}'); // Styling configuration
    table.boolean('is_active').defaultTo(true);
    table.integer('traffic_allocation').defaultTo(50); // Percentage 0-100
    table.timestamps(true, true);
    
    table.unique(['page_name', 'variant_name']);
    table.index(['page_name', 'is_active']);
  });

  await knex.schema.createTable('landing_page_experiments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('page_name').notNullable();
    table.text('hypothesis').notNullable();
    table.string('status').defaultTo('draft'); // 'draft', 'running', 'completed', 'paused'
    table.timestamp('start_date').nullable();
    table.timestamp('end_date').nullable();
    table.integer('target_sample_size').notNullable();
    table.decimal('confidence_level', 5, 2).defaultTo(95.00);
    table.jsonb('success_metrics').defaultTo('[]'); // Array of metric names
    table.jsonb('results').defaultTo('{}'); // Experiment results
    table.timestamps(true, true);
    
    table.index(['page_name', 'status']);
    table.index('status');
  });

  // Lead Magnets
  await knex.schema.createTable('lead_magnets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title').notNullable();
    table.string('type').notNullable(); // 'template', 'guide', 'checklist', 'ebook'
    table.text('description').notNullable();
    table.string('file_url').nullable();
    table.string('download_page_url').nullable();
    table.jsonb('form_fields').defaultTo('[]'); // Custom form fields
    table.boolean('is_active').defaultTo(true);
    table.integer('download_count').defaultTo(0);
    table.integer('conversion_count').defaultTo(0);
    table.string('industry_target').nullable();
    table.jsonb('tags').defaultTo('[]');
    table.timestamps(true, true);
    
    table.index(['type', 'is_active']);
    table.index('industry_target');
  });

  // Engagement & Retention
  
  // Email Marketing
  await knex.schema.createTable('email_campaigns', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('type').notNullable(); // 'onboarding', 'activation', 'retention', 'newsletter'
    table.string('trigger_event').notNullable(); // 'user_signup', 'first_prd', 'inactivity', 'scheduled'
    table.string('subject_line').notNullable();
    table.text('html_content').notNullable();
    table.text('text_content').notNullable();
    table.string('status').defaultTo('draft'); // 'draft', 'active', 'paused', 'completed'
    table.integer('delay_hours').defaultTo(0); // Delay after trigger
    table.jsonb('audience_filters').defaultTo('{}'); // User segmentation criteria
    table.integer('sent_count').defaultTo(0);
    table.integer('opened_count').defaultTo(0);
    table.integer('clicked_count').defaultTo(0);
    table.integer('unsubscribed_count').defaultTo(0);
    table.timestamps(true, true);
    
    table.index(['type', 'status']);
    table.index('trigger_event');
  });

  await knex.schema.createTable('email_sequences', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('trigger_event').notNullable();
    table.text('description').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.jsonb('audience_filters').defaultTo('{}');
    table.timestamps(true, true);
    
    table.index(['trigger_event', 'is_active']);
  });

  await knex.schema.createTable('email_sequence_steps', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('sequence_id').references('id').inTable('email_sequences').onDelete('CASCADE');
    table.uuid('campaign_id').references('id').inTable('email_campaigns').onDelete('CASCADE');
    table.integer('step_order').notNullable();
    table.integer('delay_hours').notNullable();
    table.jsonb('conditions').defaultTo('{}'); // Conditions to send this step
    table.timestamps(true, true);
    
    table.unique(['sequence_id', 'step_order']);
    table.index('sequence_id');
  });

  // In-App Notifications
  await knex.schema.createTable('notification_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('type').notNullable(); // 'achievement', 'milestone', 'social', 'system'
    table.string('trigger_event').notNullable();
    table.string('title_template').notNullable();
    table.text('message_template').notNullable();
    table.string('icon').nullable();
    table.string('color').nullable();
    table.string('action_url').nullable();
    table.string('action_text').nullable();
    table.boolean('is_active').defaultTo(true);
    table.integer('priority').defaultTo(1); // 1=low, 2=medium, 3=high
    table.timestamps(true, true);
    
    table.index(['type', 'is_active']);
    table.index('trigger_event');
  });

  await knex.schema.createTable('user_notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('template_id').references('id').inTable('notification_templates').onDelete('CASCADE').nullable();
    table.string('type').notNullable();
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.string('icon').nullable();
    table.string('color').nullable();
    table.string('action_url').nullable();
    table.string('action_text').nullable();
    table.boolean('is_read').defaultTo(false);
    table.boolean('is_dismissed').defaultTo(false);
    table.integer('priority').defaultTo(1);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    table.index(['user_id', 'is_read']);
    table.index(['user_id', 'created_at']);
    table.index('type');
  });

  // Achievement System
  await knex.schema.createTable('achievements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('key').unique().notNullable(); // 'first_prd', 'team_creator', 'power_user'
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.string('icon').notNullable();
    table.string('category').notNullable(); // 'creation', 'collaboration', 'growth', 'engagement'
    table.integer('points').defaultTo(0);
    table.string('badge_color').notNullable();
    table.jsonb('criteria').notNullable(); // Achievement criteria
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_hidden').defaultTo(false); // Hidden until unlocked
    table.timestamps(true, true);
    
    table.index(['category', 'is_active']);
    table.index('key');
  });

  await knex.schema.createTable('user_achievements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('achievement_id').references('id').inTable('achievements').onDelete('CASCADE');
    table.timestamp('earned_at').defaultTo(knex.fn.now());
    table.jsonb('progress_data').defaultTo('{}'); // Progress toward achievement
    table.boolean('is_notified').defaultTo(false);
    table.timestamps(true, true);
    
    table.unique(['user_id', 'achievement_id']);
    table.index(['user_id', 'earned_at']);
    table.index('achievement_id');
  });

  // Growth Analytics
  
  // Viral Growth Tracking
  await knex.schema.createTable('viral_actions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('action_type').notNullable(); // 'share', 'invite', 'referral', 'like', 'clone'
    table.string('content_type').notNullable(); // 'prd', 'template', 'blog_post', 'case_study'
    table.uuid('content_id').notNullable(); // ID of shared content
    table.string('platform').nullable(); // 'email', 'twitter', 'linkedin', 'slack'
    table.string('referrer_url').nullable();
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['user_id', 'action_type']);
    table.index(['content_type', 'content_id']);
    table.index(['action_type', 'created_at']);
  });

  // Conversion Funnel Tracking
  await knex.schema.createTable('conversion_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('session_id').notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').nullable();
    table.string('event_type').notNullable(); // 'page_view', 'signup', 'activation', 'conversion'
    table.string('page_name').nullable();
    table.string('variant_id').nullable(); // For A/B testing
    table.jsonb('event_data').defaultTo('{}');
    table.string('utm_source').nullable();
    table.string('utm_medium').nullable();
    table.string('utm_campaign').nullable();
    table.string('referrer_url').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['session_id', 'created_at']);
    table.index(['user_id', 'event_type']);
    table.index(['event_type', 'created_at']);
    table.index(['page_name', 'variant_id']);
  });

  // Growth Metrics Aggregation
  await knex.schema.createTable('growth_metrics_daily', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.date('date').notNullable();
    table.string('metric_type').notNullable(); // 'viral_coefficient', 'conversion_rate', 'retention'
    table.string('segment').nullable(); // 'all', 'organic', 'referral', 'paid'
    table.decimal('value', 15, 4).notNullable();
    table.integer('sample_size').defaultTo(0);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    table.unique(['date', 'metric_type', 'segment']);
    table.index(['metric_type', 'date']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order of dependencies
  await knex.schema.dropTableIfExists('growth_metrics_daily');
  await knex.schema.dropTableIfExists('conversion_events');
  await knex.schema.dropTableIfExists('viral_actions');
  await knex.schema.dropTableIfExists('user_achievements');
  await knex.schema.dropTableIfExists('achievements');
  await knex.schema.dropTableIfExists('user_notifications');
  await knex.schema.dropTableIfExists('notification_templates');
  await knex.schema.dropTableIfExists('email_sequence_steps');
  await knex.schema.dropTableIfExists('email_sequences');
  await knex.schema.dropTableIfExists('email_campaigns');
  await knex.schema.dropTableIfExists('lead_magnets');
  await knex.schema.dropTableIfExists('landing_page_experiments');
  await knex.schema.dropTableIfExists('landing_page_variants');
  await knex.schema.dropTableIfExists('marketplace_templates');
  await knex.schema.dropTableIfExists('case_studies');
  await knex.schema.dropTableIfExists('blog_posts');
  await knex.schema.dropTableIfExists('referral_rewards');
  await knex.schema.dropTableIfExists('referrals');
  await knex.schema.dropTableIfExists('referral_codes');
  await knex.schema.dropTableIfExists('public_prds');
}