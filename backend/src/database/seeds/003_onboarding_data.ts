import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('template_ratings').del();
  await knex('user_tutorial_progress').del();
  await knex('tutorial_steps').del();
  await knex('prd_templates').del();
  await knex('industry_classifications').del();
  await knex('company_type_classifications').del();

  // Insert industry classifications
  await knex('industry_classifications').insert([
    {
      industry_key: 'technology',
      industry_name: 'Technology & Software',
      description: 'Software development, SaaS, mobile apps, and tech platforms',
      typical_prd_types: JSON.stringify(['feature', 'product', 'api', 'mobile', 'web']),
      recommended_templates: JSON.stringify([]),
      is_active: true,
      sort_order: 1
    },
    {
      industry_key: 'healthcare',
      industry_name: 'Healthcare & Medical',
      description: 'Medical devices, health apps, telemedicine, and healthcare platforms',
      typical_prd_types: JSON.stringify(['product', 'mobile', 'web', 'api']),
      recommended_templates: JSON.stringify([]),
      is_active: true,
      sort_order: 2
    },
    {
      industry_key: 'finance',
      industry_name: 'Financial Services',
      description: 'Banking, fintech, investment platforms, and financial applications',
      typical_prd_types: JSON.stringify(['feature', 'web', 'mobile', 'api']),
      recommended_templates: JSON.stringify([]),
      is_active: true,
      sort_order: 3
    },
    {
      industry_key: 'ecommerce',
      industry_name: 'E-commerce & Retail',
      description: 'Online stores, marketplace platforms, and retail technology',
      typical_prd_types: JSON.stringify(['feature', 'web', 'mobile', 'product']),
      recommended_templates: JSON.stringify([]),
      is_active: true,
      sort_order: 4
    },
    {
      industry_key: 'education',
      industry_name: 'Education & E-learning',
      description: 'Educational platforms, online courses, and learning management systems',
      typical_prd_types: JSON.stringify(['product', 'web', 'mobile', 'feature']),
      recommended_templates: JSON.stringify([]),
      is_active: true,
      sort_order: 5
    },
    {
      industry_key: 'media',
      industry_name: 'Media & Entertainment',
      description: 'Streaming platforms, content management, and entertainment apps',
      typical_prd_types: JSON.stringify(['product', 'mobile', 'web', 'feature']),
      recommended_templates: JSON.stringify([]),
      is_active: true,
      sort_order: 6
    }
  ]);

  // Insert company type classifications
  await knex('company_type_classifications').insert([
    {
      type_key: 'startup',
      type_name: 'Startup',
      description: 'Early-stage companies focusing on rapid growth and MVP development',
      characteristics: JSON.stringify({
        teamSize: 'small',
        movesFast: true,
        resourceConstrained: true,
        experimentalApproach: true
      }),
      recommended_features: JSON.stringify(['ai_generation', 'quick_templates', 'collaboration']),
      is_active: true,
      sort_order: 1
    },
    {
      type_key: 'enterprise',
      type_name: 'Enterprise',
      description: 'Large organizations with established processes and compliance requirements',
      characteristics: JSON.stringify({
        teamSize: 'large',
        processOriented: true,
        complianceFocused: true,
        structuredApproach: true
      }),
      recommended_features: JSON.stringify(['analytics', 'team_management', 'detailed_templates']),
      is_active: true,
      sort_order: 2
    },
    {
      type_key: 'agency',
      type_name: 'Agency',
      description: 'Service providers working on client projects with diverse requirements',
      characteristics: JSON.stringify({
        teamSize: 'medium',
        clientFocused: true,
        projectBased: true,
        versatileNeeds: true
      }),
      recommended_features: JSON.stringify(['template_library', 'collaboration', 'customization']),
      is_active: true,
      sort_order: 3
    },
    {
      type_key: 'freelancer',
      type_name: 'Freelancer',
      description: 'Individual consultants and independent product managers',
      characteristics: JSON.stringify({
        teamSize: 'solo',
        timeConstrained: true,
        costSensitive: true,
        efficiencyFocused: true
      }),
      recommended_features: JSON.stringify(['ai_generation', 'quick_templates', 'export_options']),
      is_active: true,
      sort_order: 4
    }
  ]);

  // Insert tutorial steps
  await knex('tutorial_steps').insert([
    {
      step_id: 'welcome',
      title: 'Welcome to PRD Creator',
      description: 'Get started with your PRD creation journey',
      content: JSON.stringify({
        type: 'interactive',
        steps: [
          {
            id: 'intro',
            title: 'Welcome!',
            description: 'PRD Creator helps you create professional Product Requirements Documents quickly and collaboratively.',
            content: 'Let\'s get you set up in just a few minutes!'
          }
        ]
      }),
      order_index: 1,
      category: 'getting-started',
      estimated_time_minutes: 2,
      prerequisites: JSON.stringify([]),
      is_required: true,
      is_active: true
    },
    {
      step_id: 'profile-setup',
      title: 'Tell us about yourself',
      description: 'Help us personalize your experience',
      content: JSON.stringify({
        type: 'interactive',
        steps: [
          {
            id: 'company-info',
            title: 'Company Information',
            description: 'This helps us recommend the right templates and features for you.',
            content: 'Select your company type and industry to get personalized recommendations.'
          }
        ]
      }),
      order_index: 2,
      category: 'getting-started',
      estimated_time_minutes: 3,
      prerequisites: JSON.stringify(['welcome']),
      is_required: true,
      is_active: true
    },
    {
      step_id: 'dashboard-tour',
      title: 'Dashboard Overview',
      description: 'Learn about your PRD Creator dashboard',
      content: JSON.stringify({
        type: 'guided',
        steps: [
          {
            id: 'navigation',
            title: 'Navigation',
            description: 'Here\'s how to navigate around PRD Creator',
            content: 'The sidebar contains all main features: Dashboard, PRDs, Templates, Teams, and Analytics.'
          },
          {
            id: 'quick-actions',
            title: 'Quick Actions',
            description: 'Create PRDs quickly from anywhere',
            content: 'Use the "+" button to create new PRDs, invite team members, or access templates.'
          }
        ]
      }),
      order_index: 3,
      category: 'getting-started',
      estimated_time_minutes: 4,
      prerequisites: JSON.stringify(['profile-setup']),
      is_required: true,
      is_active: true
    },
    {
      step_id: 'create-first-prd',
      title: 'Create Your First PRD',
      description: 'Let\'s create your first Product Requirements Document',
      content: JSON.stringify({
        type: 'interactive',
        steps: [
          {
            id: 'choose-method',
            title: 'Choose Creation Method',
            description: 'You can create PRDs manually, use AI generation, or start from a template.',
            content: 'For your first PRD, we recommend using our AI-powered generation for the best experience.'
          },
          {
            id: 'ai-generation',
            title: 'AI-Powered Generation',
            description: 'Describe your product idea and let AI create a comprehensive PRD.',
            content: 'Just tell us about your product in plain English, and we\'ll generate a professional PRD.'
          }
        ]
      }),
      order_index: 4,
      category: 'getting-started',
      estimated_time_minutes: 8,
      prerequisites: JSON.stringify(['dashboard-tour']),
      is_required: true,
      is_active: true
    },
    {
      step_id: 'collaboration-basics',
      title: 'Collaboration Features',
      description: 'Learn how to work with your team',
      content: JSON.stringify({
        type: 'guided',
        steps: [
          {
            id: 'real-time-editing',
            title: 'Real-time Editing',
            description: 'Multiple team members can edit PRDs simultaneously',
            content: 'See who\'s online, track changes, and collaborate in real-time.'
          },
          {
            id: 'comments-feedback',
            title: 'Comments and Feedback',
            description: 'Add comments to specific sections for targeted feedback',
            content: 'Click anywhere in a PRD to add comments and start discussions.'
          }
        ]
      }),
      order_index: 5,
      category: 'collaboration',
      estimated_time_minutes: 5,
      prerequisites: JSON.stringify(['create-first-prd']),
      is_required: false,
      is_active: true
    },
    {
      step_id: 'team-setup',
      title: 'Set Up Your Team',
      description: 'Invite team members and set up collaboration',
      content: JSON.stringify({
        type: 'interactive',
        steps: [
          {
            id: 'invite-members',
            title: 'Invite Team Members',
            description: 'Add colleagues to your team workspace',
            content: 'Send email invitations to team members and assign appropriate roles.'
          },
          {
            id: 'team-permissions',
            title: 'Team Permissions',
            description: 'Understand different team roles and permissions',
            content: 'Owners can manage everything, Admins can invite members, and Members can create and edit PRDs.'
          }
        ]
      }),
      order_index: 6,
      category: 'collaboration',
      estimated_time_minutes: 6,
      prerequisites: JSON.stringify(['collaboration-basics']),
      is_required: false,
      is_active: true
    },
    {
      step_id: 'analytics-introduction',
      title: 'Understanding Analytics',
      description: 'Learn how to track team productivity and insights',
      content: JSON.stringify({
        type: 'guided',
        steps: [
          {
            id: 'dashboard-metrics',
            title: 'Dashboard Metrics',
            description: 'View key productivity metrics for your team',
            content: 'Track PRDs created, active users, collaboration sessions, and more.'
          },
          {
            id: 'insights-reports',
            title: 'Insights and Reports',
            description: 'Understand team patterns and optimize workflows',
            content: 'Use analytics to identify bottlenecks and improve team efficiency.'
          }
        ]
      }),
      order_index: 7,
      category: 'advanced',
      estimated_time_minutes: 4,
      prerequisites: JSON.stringify(['team-setup']),
      is_required: false,
      is_active: true
    }
  ]);

  // Insert PRD templates for different industries and company types
  const templates = [
    // Technology Startup Templates
    {
      name: 'Mobile App Feature PRD',
      description: 'Template for new mobile application features',
      category: 'feature',
      industry: 'technology',
      company_type: 'startup',
      complexity_level: 'basic',
      template_content: JSON.stringify({
        sections: [
          {
            id: 'overview',
            title: 'Feature Overview',
            description: 'High-level description of the feature',
            content: '',
            placeholder: 'Describe the feature in 2-3 sentences...',
            required: true,
            order: 1,
            type: 'text'
          },
          {
            id: 'problem-statement',
            title: 'Problem Statement',
            description: 'What problem does this feature solve?',
            content: '',
            placeholder: 'Define the user problem or business need...',
            required: true,
            order: 2,
            type: 'text'
          },
          {
            id: 'user-stories',
            title: 'User Stories',
            description: 'Key user scenarios and acceptance criteria',
            content: '',
            placeholder: 'As a [user type], I want [goal] so that [reason]...',
            required: true,
            order: 3,
            type: 'list'
          },
          {
            id: 'technical-requirements',
            title: 'Technical Requirements',
            description: 'Technical specifications and constraints',
            content: '',
            placeholder: 'List technical requirements, APIs, performance criteria...',
            required: true,
            order: 4,
            type: 'list'
          },
          {
            id: 'success-metrics',
            title: 'Success Metrics',
            description: 'How will we measure success?',
            content: '',
            placeholder: 'Define KPIs, metrics, and success criteria...',
            required: true,
            order: 5,
            type: 'list'
          }
        ],
        metadata: {
          estimatedTime: 30,
          difficulty: 'Beginner-friendly',
          tags: ['mobile', 'feature', 'startup'],
          version: '1.0'
        }
      }),
      metadata: JSON.stringify({
        tags: ['mobile', 'feature', 'ios', 'android'],
        estimatedTime: 30,
        difficulty: 'basic'
      }),
      is_featured: true,
      usage_count: 125,
      rating: 4.6
    },
    
    // Healthcare Enterprise Template
    {
      name: 'Healthcare Platform PRD',
      description: 'Comprehensive template for healthcare applications',
      category: 'product',
      industry: 'healthcare',
      company_type: 'enterprise',
      complexity_level: 'advanced',
      template_content: JSON.stringify({
        sections: [
          {
            id: 'executive-summary',
            title: 'Executive Summary',
            description: 'High-level overview for stakeholders',
            content: '',
            placeholder: 'Summarize the healthcare solution, target users, and business impact...',
            required: true,
            order: 1,
            type: 'text'
          },
          {
            id: 'regulatory-compliance',
            title: 'Regulatory & Compliance Requirements',
            description: 'HIPAA, FDA, and other regulatory considerations',
            content: '',
            placeholder: 'Detail HIPAA compliance, data protection, FDA requirements...',
            required: true,
            order: 2,
            type: 'text'
          },
          {
            id: 'user-personas',
            title: 'User Personas',
            description: 'Healthcare professionals and patient personas',
            content: '',
            placeholder: 'Define doctors, nurses, patients, administrators...',
            required: true,
            order: 3,
            type: 'list'
          },
          {
            id: 'clinical-workflow',
            title: 'Clinical Workflow Integration',
            description: 'How the solution fits into existing workflows',
            content: '',
            placeholder: 'Map integration with EHR systems, clinical processes...',
            required: true,
            order: 4,
            type: 'text'
          },
          {
            id: 'security-privacy',
            title: 'Security & Privacy',
            description: 'Data security and patient privacy measures',
            content: '',
            placeholder: 'Encryption, access controls, audit trails, data retention...',
            required: true,
            order: 5,
            type: 'list'
          }
        ],
        metadata: {
          estimatedTime: 90,
          difficulty: 'Advanced - Healthcare expertise required',
          tags: ['healthcare', 'enterprise', 'compliance'],
          version: '1.0'
        }
      }),
      metadata: JSON.stringify({
        tags: ['healthcare', 'hipaa', 'compliance', 'enterprise'],
        estimatedTime: 90,
        difficulty: 'advanced'
      }),
      is_featured: true,
      usage_count: 78,
      rating: 4.8
    },

    // Fintech Startup Template
    {
      name: 'Fintech API Integration PRD',
      description: 'Template for financial services API development',
      category: 'api',
      industry: 'finance',
      company_type: 'startup',
      complexity_level: 'intermediate',
      template_content: JSON.stringify({
        sections: [
          {
            id: 'api-overview',
            title: 'API Overview',
            description: 'High-level API description and purpose',
            content: '',
            placeholder: 'Describe the API functionality and business purpose...',
            required: true,
            order: 1,
            type: 'text'
          },
          {
            id: 'compliance-requirements',
            title: 'Financial Compliance',
            description: 'PCI DSS, SOX, and other financial regulations',
            content: '',
            placeholder: 'Detail PCI compliance, SOX requirements, financial regulations...',
            required: true,
            order: 2,
            type: 'text'
          },
          {
            id: 'api-endpoints',
            title: 'API Endpoints',
            description: 'Detailed endpoint specifications',
            content: '',
            placeholder: 'List endpoints, methods, parameters, responses...',
            required: true,
            order: 3,
            type: 'table'
          },
          {
            id: 'authentication',
            title: 'Authentication & Security',
            description: 'API security and authentication methods',
            content: '',
            placeholder: 'OAuth, API keys, rate limiting, security measures...',
            required: true,
            order: 4,
            type: 'text'
          },
          {
            id: 'integration-guide',
            title: 'Integration Guide',
            description: 'Developer integration instructions',
            content: '',
            placeholder: 'SDK documentation, code examples, integration steps...',
            required: true,
            order: 5,
            type: 'markdown'
          }
        ],
        metadata: {
          estimatedTime: 60,
          difficulty: 'Intermediate - Financial domain knowledge helpful',
          tags: ['fintech', 'api', 'compliance'],
          version: '1.0'
        }
      }),
      metadata: JSON.stringify({
        tags: ['fintech', 'api', 'banking', 'payments'],
        estimatedTime: 60,
        difficulty: 'intermediate'
      }),
      is_featured: false,
      usage_count: 92,
      rating: 4.4
    },

    // E-commerce Feature Template
    {
      name: 'E-commerce Shopping Cart Enhancement',
      description: 'Template for e-commerce platform features',
      category: 'feature',
      industry: 'ecommerce',
      company_type: 'enterprise',
      complexity_level: 'intermediate',
      template_content: JSON.stringify({
        sections: [
          {
            id: 'feature-description',
            title: 'Feature Description',
            description: 'Detailed description of the shopping cart enhancement',
            content: '',
            placeholder: 'Describe the enhancement and its benefits...',
            required: true,
            order: 1,
            type: 'text'
          },
          {
            id: 'customer-journey',
            title: 'Customer Journey Impact',
            description: 'How this affects the customer purchase flow',
            content: '',
            placeholder: 'Map the impact on discovery, consideration, purchase stages...',
            required: true,
            order: 2,
            type: 'text'
          },
          {
            id: 'conversion-optimization',
            title: 'Conversion Optimization',
            description: 'Expected impact on conversion rates',
            content: '',
            placeholder: 'A/B testing plan, conversion metrics, optimization goals...',
            required: true,
            order: 3,
            type: 'list'
          },
          {
            id: 'inventory-integration',
            title: 'Inventory System Integration',
            description: 'Integration with existing inventory management',
            content: '',
            placeholder: 'Real-time inventory checks, stock management, reservations...',
            required: true,
            order: 4,
            type: 'text'
          },
          {
            id: 'performance-requirements',
            title: 'Performance Requirements',
            description: 'Speed and scalability requirements',
            content: '',
            placeholder: 'Load times, concurrent users, peak traffic handling...',
            required: true,
            order: 5,
            type: 'list'
          }
        ],
        metadata: {
          estimatedTime: 45,
          difficulty: 'Intermediate - E-commerce experience helpful',
          tags: ['ecommerce', 'conversion', 'shopping'],
          version: '1.0'
        }
      }),
      metadata: JSON.stringify({
        tags: ['ecommerce', 'shopping-cart', 'conversion', 'retail'],
        estimatedTime: 45,
        difficulty: 'intermediate'
      }),
      is_featured: true,
      usage_count: 156,
      rating: 4.7
    }
  ];

  await knex('prd_templates').insert(templates);
}