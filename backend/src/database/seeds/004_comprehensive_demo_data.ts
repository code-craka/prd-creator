import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data in dependency order (most dependent first)
  await knex('viral_actions').del();
  await knex('user_achievements').del();
  await knex('user_notifications').del();
  await knex('referral_rewards').del();
  await knex('referrals').del();
  await knex('referral_codes').del();
  await knex('conversion_events').del();
  await knex('growth_metrics_daily').del();
  await knex('landing_page_experiments').del();
  await knex('landing_page_variants').del();
  await knex('email_campaigns').del();
  await knex('email_sequence_steps').del();
  await knex('email_sequences').del();
  await knex('case_studies').del();
  await knex('blog_posts').del();
  await knex('lead_magnets').del();
  await knex('marketplace_templates').del();
  await knex('public_prds').del();
  await knex('achievements').del();
  await knex('notification_templates').del();
  await knex('onboarding_analytics').del();
  await knex('user_tutorial_progress').del();
  await knex('user_onboarding').del();
  await knex('template_analytics').del();
  await knex('prd_analytics').del();
  await knex('user_activity').del();
  await knex('team_analytics').del();
  await knex('analytics_events').del();
  await knex('prd_versions').del();
  await knex('prd_comments').del();
  await knex('prds').del();
  await knex('templates').del();
  await knex('team_members').del();
  await knex('teams').del();
  await knex('users').del();

  console.log('Creating comprehensive demo data...');

  // Create sample users with varied profiles
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  const users = await knex('users').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'sarah.chen@techstartup.com',
      name: 'Sarah Chen',
      password_hash: hashedPassword,
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'michael.johnson@healthtech.com',
      name: 'Michael Johnson',
      password_hash: hashedPassword,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-01-20')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'emma.rodriguez@fintech.com',
      name: 'Emma Rodriguez',
      password_hash: hashedPassword,
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      created_at: new Date('2024-02-01'),
      updated_at: new Date('2024-02-01')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'david.kim@agency.com',
      name: 'David Kim',
      password_hash: hashedPassword,
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      created_at: new Date('2024-02-10'),
      updated_at: new Date('2024-02-10')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      email: 'alex.freelancer@gmail.com',
      name: 'Alex Thompson',
      password_hash: hashedPassword,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      created_at: new Date('2024-02-15'),
      updated_at: new Date('2024-02-15')
    }
  ]).returning('*');

  // Create diverse teams representing different company types
  const teams = await knex('teams').insert([
    {
      id: '660e8400-e29b-41d4-a716-446655440000',
      name: 'TechFlow AI',
      slug: 'techflow-ai',
      owner_id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'AI-powered productivity tools for modern teams',
      avatar_url: 'https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=100&h=100&fit=crop',
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15')
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'MediCore Systems',
      slug: 'medicore-systems',
      owner_id: '550e8400-e29b-41d4-a716-446655440001',
      description: 'Healthcare technology solutions for hospitals and clinics',
      avatar_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=100&h=100&fit=crop',
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-01-20')
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      name: 'FinanceFlow Pro',
      slug: 'financeflow-pro',
      owner_id: '550e8400-e29b-41d4-a716-446655440002',
      description: 'Next-generation fintech platform for SMBs',
      avatar_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=100&h=100&fit=crop',
      created_at: new Date('2024-02-01'),
      updated_at: new Date('2024-02-01')
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440003',
      name: 'Design & Product Agency',
      slug: 'design-product-agency',
      owner_id: '550e8400-e29b-41d4-a716-446655440003',
      description: 'Full-service product design and development agency',
      avatar_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=100&h=100&fit=crop',
      created_at: new Date('2024-02-10'),
      updated_at: new Date('2024-02-10')
    }
  ]).returning('*');

  // Create team memberships with various roles
  await knex('team_members').insert([
    // TechFlow AI team
    {
      team_id: '660e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      role: 'owner',
      joined_at: new Date('2024-01-15')
    },
    {
      team_id: '660e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440004',
      role: 'admin',
      invited_by: '550e8400-e29b-41d4-a716-446655440000',
      joined_at: new Date('2024-02-16')
    },
    // MediCore Systems team
    {
      team_id: '660e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      role: 'owner',
      joined_at: new Date('2024-01-20')
    },
    {
      team_id: '660e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      role: 'member',
      invited_by: '550e8400-e29b-41d4-a716-446655440001',
      joined_at: new Date('2024-02-05')
    },
    // FinanceFlow Pro team
    {
      team_id: '660e8400-e29b-41d4-a716-446655440002',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      role: 'owner',
      joined_at: new Date('2024-02-01')
    },
    {
      team_id: '660e8400-e29b-41d4-a716-446655440002',
      user_id: '550e8400-e29b-41d4-a716-446655440003',
      role: 'admin',
      invited_by: '550e8400-e29b-41d4-a716-446655440002',
      joined_at: new Date('2024-02-12')
    },
    // Design Agency team
    {
      team_id: '660e8400-e29b-41d4-a716-446655440003',
      user_id: '550e8400-e29b-41d4-a716-446655440003',
      role: 'owner',
      joined_at: new Date('2024-02-10')
    }
  ]);

  // Update users with current team assignments
  await knex('users').where('id', '550e8400-e29b-41d4-a716-446655440000').update({
    current_team_id: '660e8400-e29b-41d4-a716-446655440000'
  });
  await knex('users').where('id', '550e8400-e29b-41d4-a716-446655440001').update({
    current_team_id: '660e8400-e29b-41d4-a716-446655440001'
  });
  await knex('users').where('id', '550e8400-e29b-41d4-a716-446655440002').update({
    current_team_id: '660e8400-e29b-41d4-a716-446655440002'
  });
  await knex('users').where('id', '550e8400-e29b-41d4-a716-446655440003').update({
    current_team_id: '660e8400-e29b-41d4-a716-446655440003'
  });

  // Create comprehensive templates
  await knex('templates').insert([
    {
      id: '770e8400-e29b-41d4-a716-446655440000',
      name: 'AI-Powered Feature PRD',
      description: 'Template for AI and machine learning features',
      structure: {
        questions: [
          {
            id: 'q1',
            label: 'What AI capability are you building?',
            type: 'textarea',
            placeholder: 'Describe the AI feature: recommendation engine, chatbot, prediction model, etc.',
            required: true
          },
          {
            id: 'q2',
            label: 'What data will train and power this AI feature?',
            type: 'textarea',
            placeholder: 'Describe data sources, training datasets, real-time inputs...',
            required: true
          },
          {
            id: 'q3',
            label: 'How will users interact with the AI feature?',
            type: 'textarea',
            placeholder: 'User interface, automation level, feedback mechanisms...',
            required: true
          }
        ],
        sections: [
          'AI Feature Overview',
          'User Experience & Interface',
          'Machine Learning Requirements',
          'Data Sources & Privacy',
          'Performance & Accuracy Goals',
          'Fallback & Error Handling',
          'Success Metrics & Monitoring'
        ]
      },
      industry: 'technology',
      is_public: true,
      usage_count: 89,
      created_by: '550e8400-e29b-41d4-a716-446655440000'
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440001',
      name: 'Healthcare Compliance PRD',
      description: 'HIPAA-compliant healthcare application template',
      structure: {
        questions: [
          {
            id: 'q1',
            label: 'What healthcare workflow does this improve?',
            type: 'textarea',
            placeholder: 'Patient care, clinical decision support, administrative process...',
            required: true
          },
          {
            id: 'q2',
            label: 'What sensitive data will be handled?',
            type: 'textarea',
            placeholder: 'PHI, medical records, billing information, clinical data...',
            required: true
          },
          {
            id: 'q3',
            label: 'Who are the clinical users?',
            type: 'textarea',
            placeholder: 'Doctors, nurses, patients, administrators, specialists...',
            required: true
          }
        ],
        sections: [
          'Clinical Overview',
          'HIPAA Compliance Requirements',
          'User Roles & Permissions',
          'Data Security & Encryption',
          'Audit Trail & Monitoring',
          'Integration with EHR Systems',
          'Clinical Validation & Testing'
        ]
      },
      industry: 'healthcare',
      is_public: true,
      usage_count: 67,
      created_by: '550e8400-e29b-41d4-a716-446655440001'
    }
  ]);

  // Create sample PRDs with rich content
  const samplePRDs = await knex('prds').insert([
    {
      id: '880e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      team_id: '660e8400-e29b-41d4-a716-446655440000',
      title: 'Smart Code Review Assistant with AI',
      content: `# AI-Powered Code Review Assistant

## AI Feature Overview

An intelligent code review assistant that uses machine learning to automatically identify potential bugs, security vulnerabilities, and code quality issues in pull requests. The AI will provide contextual suggestions and learn from team coding patterns.

## User Experience & Interface

**Developer Workflow Integration:**
- Seamless GitHub/GitLab integration
- Inline comments with AI suggestions
- Dashboard showing code quality trends
- Smart notifications for critical issues

**AI Interaction Model:**
- Real-time analysis during code writing
- Contextual suggestions with confidence scores
- One-click fix applications
- Learning from developer feedback

## Machine Learning Requirements

**Models & Capabilities:**
- Static code analysis with ML enhancement
- Vulnerability detection using trained security models
- Code pattern recognition for best practices
- Performance bottleneck prediction

**Training Data:**
- Open source repositories with known issues
- Internal codebase patterns and fixes
- Security vulnerability databases
- Code review feedback history

## Data Sources & Privacy

**Input Data:**
- Source code (tokenized and anonymized)
- Git commit history and patterns
- Code review comments and decisions
- Build and test results

**Privacy Measures:**
- Code never leaves secure environment
- Tokenization of sensitive business logic
- Opt-out for confidential repositories
- SOC 2 compliant data handling

## Performance & Accuracy Goals

**Target Metrics:**
- 85% accuracy in bug detection
- <2 second analysis time per file
- 70% reduction in critical bugs reaching production
- 30% faster code review cycles

## Success Metrics & Monitoring

**Key Performance Indicators:**
- Developer adoption rate (target: 80%)
- Time saved per code review (target: 15 minutes)
- Bug detection accuracy improvements
- Developer satisfaction scores (target: 4.2/5)

**Monitoring Dashboard:**
- Real-time model performance metrics
- Code quality trend analysis
- Developer engagement analytics
- Cost per analysis optimization`,
      visibility: 'team',
      metadata: {
        questions: {
          q1: 'An AI-powered code review assistant that automatically identifies bugs, security vulnerabilities, and code quality issues',
          q2: 'Training data from open source repos, internal codebase patterns, security databases, and code review feedback',
          q3: 'Developers interact through IDE integration with real-time suggestions, dashboard analytics, and one-click fixes'
        },
        generated_at: new Date(),
        model: 'claude-3',
        ai_generated: true
      },
      template_id: '770e8400-e29b-41d4-a716-446655440000',
      view_count: 23,
      created_at: new Date('2024-02-20'),
      updated_at: new Date('2024-02-22')
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      team_id: '660e8400-e29b-41d4-a716-446655440001',
      title: 'Patient Portal with Telemedicine Integration',
      content: `# Patient Portal with Telemedicine Integration

## Clinical Overview

A comprehensive patient portal that integrates telemedicine capabilities, allowing patients to schedule virtual appointments, access medical records, communicate with healthcare providers, and manage their health data in a HIPAA-compliant environment.

## HIPAA Compliance Requirements

**Data Protection:**
- End-to-end encryption for all patient communications
- Multi-factor authentication for patient access
- Automatic session timeouts and secure logout
- Encrypted data storage with audit trails

**Access Controls:**
- Role-based permissions for healthcare staff
- Patient data segregation by provider
- Granular consent management for data sharing
- Emergency access protocols with logging

## User Roles & Permissions

**Patient Users:**
- View medical records and test results
- Schedule and join telemedicine appointments
- Secure messaging with healthcare providers
- Manage appointment history and medications

**Healthcare Providers:**
- Access patient records during consultations
- Conduct video consultations with recording
- Update patient charts and treatment plans
- Prescribe medications electronically

**Administrative Staff:**
- Manage appointment scheduling
- Handle billing and insurance verification
- Generate compliance reports
- Monitor system usage and performance

## Data Security & Encryption

**Technical Safeguards:**
- AES-256 encryption for data at rest
- TLS 1.3 for data in transit
- FIDO2 authentication protocols
- Zero-knowledge encryption for sensitive data

**Physical Safeguards:**
- AWS/Azure SOC 2 certified infrastructure
- Geographically distributed backups
- 99.9% uptime SLA with redundancy
- Regular security assessments and penetration testing

## Integration with EHR Systems

**Supported Integrations:**
- Epic MyChart API integration
- Cerner PowerChart connectivity
- HL7 FHIR standard compliance
- Real-time sync with practice management systems

**Data Synchronization:**
- Bidirectional patient data sync
- Appointment scheduling integration
- Lab results and imaging import
- Medication reconciliation

## Success Metrics

**Clinical Outcomes:**
- 40% increase in patient engagement
- 25% reduction in no-show appointments
- 90% patient satisfaction with telemedicine
- 50% decrease in administrative phone calls

**Compliance Metrics:**
- 100% HIPAA audit compliance
- Zero data breaches or security incidents
- <24 hour response time for security issues
- Annual compliance certification maintenance`,
      visibility: 'team',
      metadata: {
        questions: {
          q1: 'A patient portal that improves access to healthcare through telemedicine, appointment scheduling, and secure communication',
          q2: 'Patient health information (PHI), medical records, appointment data, secure messaging, and telemedicine recordings',
          q3: 'Patients, doctors, nurses, administrative staff, and healthcare specialists with role-based access controls'
        },
        generated_at: new Date(),
        model: 'claude-3',
        ai_generated: true
      },
      template_id: '770e8400-e29b-41d4-a716-446655440001',
      view_count: 45,
      created_at: new Date('2024-02-18'),
      updated_at: new Date('2024-02-25')
    }
  ]).returning('*');

  // Create analytics events to show usage patterns
  const analyticsEvents = [];
  const eventTypes = ['prd_created', 'prd_viewed', 'prd_edited', 'comment_added', 'team_member_invited'];
  
  // Generate events over the past 30 days
  for (let i = 0; i < 150; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() - daysAgo);
    
    const eventCategory = eventTypes[Math.floor(Math.random() * eventTypes.length)].includes('prd') ? 'prd' : 'team';
    
    analyticsEvents.push({
      user_id: users[Math.floor(Math.random() * users.length)].id,
      team_id: teams[Math.floor(Math.random() * teams.length)].id,
      event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      event_category: eventCategory,
      event_data: {
        duration: Math.floor(Math.random() * 1800), // 0-30 minutes
        platform: Math.random() > 0.7 ? 'mobile' : 'web',
        prd_id: Math.random() > 0.5 ? samplePRDs[Math.floor(Math.random() * samplePRDs.length)].id : null,
        session_id: `session_${Math.random().toString(36).substr(2, 9)}`
      },
      created_at: eventDate
    });
  }
  
  await knex('analytics_events').insert(analyticsEvents);

  // Create user onboarding records
  await knex('user_onboarding').insert([
    {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      industry: 'technology',
      company_type: 'startup',
      experience_level: 'intermediate',
      team_size: '10-50',
      preferences: { use_case: 'product_development' },
      welcome_completed: true,
      profile_setup_completed: true,
      first_prd_created: true,
      team_invitation_sent: true,
      tutorial_completed: true,
      completion_percentage: 100,
      completed_at: new Date('2024-01-16'),
      created_at: new Date('2024-01-15')
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      industry: 'healthcare',
      company_type: 'enterprise',
      experience_level: 'advanced',
      team_size: '500+',
      preferences: { use_case: 'clinical_workflows' },
      welcome_completed: true,
      profile_setup_completed: true,
      first_prd_created: true,
      team_invitation_sent: false,
      tutorial_completed: false,
      completion_percentage: 75,
      created_at: new Date('2024-01-20')
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      industry: 'finance',
      company_type: 'startup',
      experience_level: 'beginner',
      team_size: '2-10',
      preferences: { use_case: 'fintech_development' },
      welcome_completed: true,
      profile_setup_completed: true,
      first_prd_created: false,
      team_invitation_sent: false,
      tutorial_completed: false,
      completion_percentage: 40,
      created_at: new Date('2024-02-01')
    }
  ]);

  // Create achievements
  await knex('achievements').insert([
    {
      key: 'first_prd',
      title: 'First PRD Created',
      description: 'Created your first Product Requirements Document',
      icon: '📝',
      category: 'milestone',
      badge_color: '#10B981',
      points: 100,
      criteria: { action: 'prd_created', count: 1 },
      is_active: true
    },
    {
      key: 'team_builder',
      title: 'Team Builder',
      description: 'Invited 5 team members to collaborate',
      icon: '👥',
      category: 'teamwork',
      badge_color: '#3B82F6',
      points: 250,
      criteria: { action: 'member_invited', count: 5 },
      is_active: true
    },
    {
      key: 'collaboration_expert',
      title: 'Collaboration Expert',
      description: 'Added 25 comments to team PRDs',
      icon: '💬',
      category: 'collaboration',
      badge_color: '#8B5CF6',
      points: 300,
      criteria: { action: 'comment_added', count: 25 },
      is_active: true
    }
  ]);

  // Get achievement IDs first
  const achievements = await knex('achievements').select('id', 'key');
  const achievementIds = achievements.reduce((acc, achievement) => {
    acc[achievement.key] = achievement.id;
    return acc;
  }, {} as Record<string, string>);

  // Create user achievements
  await knex('user_achievements').insert([
    {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      achievement_id: achievementIds.first_prd,
      earned_at: new Date('2024-01-16'),
      progress_data: { points_earned: 100 }
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      achievement_id: achievementIds.team_builder,
      earned_at: new Date('2024-02-16'),
      progress_data: { points_earned: 250 }
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      achievement_id: achievementIds.first_prd,
      earned_at: new Date('2024-01-22'),
      progress_data: { points_earned: 100 }
    }
  ]);

  console.log('✅ Comprehensive demo data created successfully!');
  console.log('👥 Users: 5 users with different roles and experience levels');
  console.log('🏢 Teams: 4 teams representing different industries and company types');
  console.log('📄 PRDs: 2 detailed AI-generated PRDs with real content');
  console.log('📊 Analytics: 150 events showing realistic usage patterns');
  console.log('🎯 Onboarding: User progress data across different completion stages');
  console.log('🏆 Achievements: Gamification system with badges and points');
  console.log('');
  console.log('Demo Login Credentials:');
  console.log('Email: sarah.chen@techstartup.com | Password: demo123');
  console.log('Email: michael.johnson@healthtech.com | Password: demo123');
  console.log('Email: emma.rodriguez@fintech.com | Password: demo123');
}