import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('analytics_events').del();
  await knex('prds').del();
  await knex('templates').del();
  await knex('team_members').del();
  await knex('teams').del();
  await knex('users').del();

  // Insert sample users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await knex('users').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'john@example.com',
      name: 'John Doe',
      password_hash: hashedPassword,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'jane@example.com',
      name: 'Jane Smith',
      password_hash: hashedPassword,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'bob@example.com',
      name: 'Bob Johnson',
      password_hash: hashedPassword,
    },
  ]).returning('*');

  // Insert sample teams
  await knex('teams').insert([
    {
      id: '660e8400-e29b-41d4-a716-446655440000',
      name: 'Product Team',
      slug: 'product-team',
      owner_id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Our main product development team',
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Engineering Team',
      slug: 'engineering-team',
      owner_id: '550e8400-e29b-41d4-a716-446655440001',
      description: 'Core engineering and development team',
    },
  ]).returning('*');

  // Insert team members
  await knex('team_members').insert([
    {
      team_id: '660e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      role: 'owner',
      joined_at: knex.fn.now(),
    },
    {
      team_id: '660e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      role: 'member',
      invited_by: '550e8400-e29b-41d4-a716-446655440000',
      joined_at: knex.fn.now(),
    },
    {
      team_id: '660e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      role: 'owner',
      joined_at: knex.fn.now(),
    },
    {
      team_id: '660e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      role: 'member',
      invited_by: '550e8400-e29b-41d4-a716-446655440001',
      joined_at: knex.fn.now(),
    },
  ]);

  // Update users with current team
  await knex('users').where('id', '550e8400-e29b-41d4-a716-446655440000').update({
    current_team_id: '660e8400-e29b-41d4-a716-446655440000',
  });
  
  await knex('users').where('id', '550e8400-e29b-41d4-a716-446655440001').update({
    current_team_id: '660e8400-e29b-41d4-a716-446655440001',
  });

  // Insert sample templates
  await knex('templates').insert([
    {
      id: '770e8400-e29b-41d4-a716-446655440000',
      name: 'Standard PRD Template',
      description: 'A comprehensive template for product requirements documents',
      structure: {
        questions: [
          {
            id: 'q1',
            label: 'What product or feature are you building?',
            type: 'textarea',
            placeholder: 'Describe the product or feature in detail...',
            required: true,
          },
          {
            id: 'q2',
            label: 'Who are the target users and what problem does this solve?',
            type: 'textarea',
            placeholder: 'Define your target audience and the problem being solved...',
            required: true,
          },
          {
            id: 'q3',
            label: 'What are the key features and success metrics?',
            type: 'textarea',
            placeholder: 'List key features and how you will measure success...',
            required: true,
          },
        ],
        sections: [
          'TL;DR',
          'Goals',
          'User Stories',
          'Functional Requirements',
          'User Experience',
          'Narrative',
          'Success Metrics',
          'Milestones & Sequencing',
        ],
      },
      industry: 'general',
      is_public: true,
      usage_count: 0,
      created_by: '550e8400-e29b-41d4-a716-446655440000',
    },
  ]);

  // Insert sample PRDs
  await knex('prds').insert([
    {
      id: '880e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      team_id: '660e8400-e29b-41d4-a716-446655440000',
      title: 'Mobile Shopping App with AI Recommendations',
      content: `# One-pager: Mobile Shopping App with AI Recommendations

## 1. TL;DR
A mobile shopping app that uses AI to provide personalized product recommendations, streamlining the shopping experience for busy professionals aged 25-45.

## 2. Goals
### Business Goals
* Increase user engagement by 40%
* Improve conversion rates by 30%
* Build a personalized shopping platform

### User Goals
* Discover products tailored to their style
* Save time while shopping
* Get better value through personalized recommendations

### Non-Goals
* Inventory management
* Merchant onboarding tools
* Social sharing features (v1)

## 3. User stories
**Primary Persona: Busy Professional (25-45)**
- As a busy professional, I want personalized product recommendations so I can shop efficiently
- As a user, I want quick checkout options so I can complete purchases without delays
- As a shopper, I want size predictions so I can order with confidence

## 4. Functional requirements
**High Priority:**
* AI-powered product recommendations
* One-tap checkout functionality
* Size prediction algorithm
* User preference learning

**Medium Priority:**
* Price tracking and alerts
* Wishlist with sharing
* Order history and reordering

## 5. User experience
* Seamless onboarding with style quiz
* Homepage with personalized product feed
* Quick product details with AR try-on
* Streamlined checkout process
* Post-purchase tracking and feedback

## 6. Narrative
Sarah opens the app during her lunch break. The AI has learned her style preferences and shows her a curated feed of items she'd love. She finds a perfect dress, uses AR to see how it looks, and completes purchase with one tap. The app predicted her size correctly, and she receives it the next day.

## 7. Success metrics
* 40% increase in average order value
* 60% reduction in cart abandonment
* 85% size prediction accuracy
* 4.5+ app store rating

## 8. Milestones & sequencing
**Phase 1 (8 weeks):** Core recommendation engine and basic shopping flow
**Phase 2 (6 weeks):** AR try-on and size prediction
**Phase 3 (4 weeks):** Advanced personalization and social features`,
      visibility: 'team',
      metadata: {
        questions: {
          q1: 'A mobile shopping app with AI-powered personalized recommendations and instant checkout',
          q2: 'Busy professionals aged 25-45 who want to shop efficiently and discover products tailored to their style without spending hours browsing',
          q3: 'AI style recommendations, one-tap checkout, size prediction, AR try-on feature, price tracking, and wishlist sharing. Success measured by 40% increase in average order value and 60% reduction in cart abandonment',
        },
        generated_at: new Date(),
        model: 'claude-3',
      },
      template_id: '770e8400-e29b-41d4-a716-446655440000',
    },
  ]);
}