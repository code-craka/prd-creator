import Joi from 'joi';

/**
 * Centralized validation schemas for the PRD Creator application
 * This file contains all validation schemas used across the backend routes
 * to eliminate duplication and ensure consistency
 */

// Common field validators
const commonFields = {
  id: Joi.string().uuid(),
  email: Joi.string().email(),
  password: Joi.string().min(6).max(128),
  name: Joi.string().min(2).max(100),
  title: Joi.string().min(1).max(500),
  content: Joi.string().min(1),
  visibility: Joi.string().valid('private', 'team', 'public'),
  role: Joi.string().valid('owner', 'admin', 'member'),
  
  // Pagination fields
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  
  // Date fields
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  
  // Search field
  search: Joi.string().max(255),
};

// ================================
// AUTH VALIDATION SCHEMAS
// ================================

export const authSchemas = {
  register: Joi.object({
    email: commonFields.email.required(),
    name: commonFields.name.required(),
    password: commonFields.password.required(),
  }),

  login: Joi.object({
    email: commonFields.email.required(),
    password: Joi.string().required(), // Don't enforce min length on login
  }),

  resetPassword: Joi.object({
    email: commonFields.email.required(),
  }),

  updatePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonFields.password.required(),
  }),
};

// ================================
// TEAM VALIDATION SCHEMAS
// ================================

export const teamSchemas = {
  create: Joi.object({
    name: commonFields.name.required(),
    description: Joi.string().max(500).optional(),
  }),

  update: Joi.object({
    name: commonFields.name.optional(),
    description: Joi.string().max(500).optional(),
  }),

  inviteMember: Joi.object({
    email: commonFields.email.required(),
    role: commonFields.role.default('member'),
  }),

  updateMemberRole: Joi.object({
    role: commonFields.role.required(),
  }),

  filters: Joi.object({
    search: commonFields.search.optional(),
    page: commonFields.page,
    limit: commonFields.limit,
  }),
};

// ================================
// PRD VALIDATION SCHEMAS
// ================================

export const prdSchemas = {
  create: Joi.object({
    title: commonFields.title.required(),
    content: commonFields.content.required(),
    teamId: commonFields.id.optional(),
    visibility: commonFields.visibility.default('private'),
    metadata: Joi.object().optional(),
    templateId: commonFields.id.optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  }),

  update: Joi.object({
    title: commonFields.title.optional(),
    content: commonFields.content.optional(),
    visibility: commonFields.visibility.optional(),
    metadata: Joi.object().optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  }),

  filters: Joi.object({
    search: commonFields.search.optional(),
    author: Joi.string().max(255).optional(),
    dateFrom: commonFields.dateFrom.optional(),
    dateTo: commonFields.dateTo.optional(),
    templateId: commonFields.id.optional(),
    visibility: commonFields.visibility.optional(),
    teamId: commonFields.id.optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    page: commonFields.page,
    limit: commonFields.limit,
  }),

  bulkOperation: Joi.object({
    prdIds: Joi.array().items(commonFields.id).min(1).max(50).required(),
    operation: Joi.string().valid('delete', 'archive', 'updateVisibility').required(),
    data: Joi.object().optional(),
  }),
};

// ================================
// ANALYTICS VALIDATION SCHEMAS
// ================================

export const analyticsSchemas = {
  trackEvent: Joi.object({
    eventType: Joi.string().required(),
    eventCategory: Joi.string().required(),
    eventData: Joi.object().optional(),
    prdId: commonFields.id.optional(),
    sessionId: Joi.string().optional(),
    timestamp: Joi.date().iso().optional(),
  }),

  query: Joi.object({
    timeRange: Joi.string().valid('7d', '30d', '90d', '6m', '1y').default('30d'),
    teamId: commonFields.id.optional(),
    eventType: Joi.string().optional(),
    eventCategory: Joi.string().optional(),
    prdId: commonFields.id.optional(),
    page: commonFields.page,
    limit: commonFields.limit,
  }),

  dashboard: Joi.object({
    timeRange: Joi.string().valid('7d', '30d', '90d').default('30d'),
    teamId: commonFields.id.optional(),
  }),
};

// ================================
// TEMPLATE VALIDATION SCHEMAS
// ================================

export const templateSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional(),
    structure: Joi.object({
      questions: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          label: Joi.string().required(),
          type: Joi.string().valid('text', 'textarea', 'select', 'checkbox', 'radio').required(),
          placeholder: Joi.string().optional(),
          options: Joi.array().items(Joi.string()).optional(),
          required: Joi.boolean().default(false),
          validation: Joi.object({
            minLength: Joi.number().min(0).optional(),
            maxLength: Joi.number().min(1).optional(),
            pattern: Joi.string().optional(),
          }).optional(),
        })
      ).required(),
      sections: Joi.array().items(Joi.string()).required(),
    }).required(),
    industry: Joi.string().max(100).optional(),
    isPublic: Joi.boolean().default(false),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional(),
    structure: Joi.object({
      questions: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          label: Joi.string().required(),
          type: Joi.string().valid('text', 'textarea', 'select', 'checkbox', 'radio').required(),
          placeholder: Joi.string().optional(),
          options: Joi.array().items(Joi.string()).optional(),
          required: Joi.boolean().default(false),
          validation: Joi.object({
            minLength: Joi.number().min(0).optional(),
            maxLength: Joi.number().min(1).optional(),
            pattern: Joi.string().optional(),
          }).optional(),
        })
      ).optional(),
      sections: Joi.array().items(Joi.string()).optional(),
    }).optional(),
    industry: Joi.string().max(100).optional(),
    isPublic: Joi.boolean().optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  }),

  filters: Joi.object({
    search: commonFields.search.optional(),
    industry: Joi.string().max(100).optional(),
    isPublic: Joi.boolean().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    page: commonFields.page,
    limit: commonFields.limit,
  }),
};

// ================================
// COMMENT VALIDATION SCHEMAS
// ================================

export const commentSchemas = {
  create: Joi.object({
    content: Joi.string().min(1).max(2000).required(),
    section: Joi.string().required(),
    position: Joi.number().min(0).required(),
    parentId: commonFields.id.optional(),
  }),

  update: Joi.object({
    content: Joi.string().min(1).max(2000).required(),
  }),

  resolve: Joi.object({
    resolved: Joi.boolean().required(),
  }),
};

// ================================
// ONBOARDING VALIDATION SCHEMAS
// ================================

export const onboardingSchemas = {
  updateStep: Joi.object({
    step: Joi.string().valid('account_setup', 'team_creation', 'first_prd', 'collaboration', 'completed').required(),
    data: Joi.object().optional(),
  }),

  completeOnboarding: Joi.object({
    feedback: Joi.string().max(1000).optional(),
    rating: Joi.number().min(1).max(5).optional(),
  }),
};

// ================================
// FILE UPLOAD VALIDATION SCHEMAS
// ================================

export const fileSchemas = {
  upload: Joi.object({
    type: Joi.string().valid('avatar', 'document', 'template').required(),
    filename: Joi.string().max(255).required(),
    contentType: Joi.string().valid(
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/markdown'
    ).required(),
    size: Joi.number().max(10 * 1024 * 1024).required(), // 10MB max
  }),
};

// ================================
// NOTIFICATION VALIDATION SCHEMAS
// ================================

export const notificationSchemas = {
  create: Joi.object({
    type: Joi.string().valid('comment', 'mention', 'invite', 'update').required(),
    title: Joi.string().max(255).required(),
    message: Joi.string().max(1000).required(),
    recipientId: commonFields.id.required(),
    metadata: Joi.object().optional(),
  }),

  markRead: Joi.object({
    notificationIds: Joi.array().items(commonFields.id).min(1).max(100).required(),
  }),

  filters: Joi.object({
    type: Joi.string().valid('comment', 'mention', 'invite', 'update').optional(),
    read: Joi.boolean().optional(),
    page: commonFields.page,
    limit: commonFields.limit,
  }),
};

// ================================
// COLLABORATION VALIDATION SCHEMAS
// ================================

export const collaborationSchemas = {
  operation: Joi.object({
    type: Joi.string().valid('insert', 'delete', 'replace').required(),
    section: Joi.string().required(),
    position: Joi.number().min(0).required(),
    content: Joi.string().optional(),
    length: Joi.number().min(0).optional(),
  }),

  presence: Joi.object({
    type: Joi.string().valid('cursor', 'selection', 'typing', 'idle').required(),
    data: Joi.object({
      section: Joi.string().optional(),
      position: Joi.number().min(0).optional(),
      start: Joi.number().min(0).optional(),
      end: Joi.number().min(0).optional(),
      isTyping: Joi.boolean().optional(),
    }).required(),
  }),
};

// ================================
// AI SERVICE SCHEMAS
// ================================

export const aiSchemas = {
  generatePRD: Joi.object({
    prompt: Joi.string().min(10).max(2000).required(),
    prdType: Joi.string().valid('feature', 'product', 'api', 'mobile', 'web', 'enhancement', 'custom').required(),
    context: Joi.object({
      company: Joi.string().max(200).optional(),
      industry: Joi.string().max(200).optional(),
      targetAudience: Joi.string().max(500).optional(),
      existingProducts: Joi.array().items(Joi.string().max(200)).max(10).optional(),
      timeline: Joi.string().max(200).optional(),
      budget: Joi.string().max(200).optional(),
      stakeholders: Joi.array().items(Joi.string().max(200)).max(20).optional(),
      requirements: Joi.array().items(Joi.string().max(500)).max(20).optional(),
    }).optional(),
    style: Joi.string().valid('technical', 'business', 'executive', 'detailed', 'concise').optional(),
    sections: Joi.array().items(Joi.string().max(200)).max(20).optional(),
    customInstructions: Joi.string().max(1000).optional(),
    provider: Joi.object({
      name: Joi.string().valid('anthropic', 'openai').required(),
      model: Joi.string().required(),
      maxTokens: Joi.number().min(100).max(8000).required(),
      temperature: Joi.number().min(0).max(2).required(),
    }).optional(),
  }),

  generateSuggestions: Joi.object({
    prdId: Joi.string().uuid().required(),
    section: Joi.string().required(),
    content: Joi.string().required(),
    context: Joi.string().max(1000).optional(),
  }),

  improveSection: Joi.object({
    prdId: Joi.string().uuid().required(),
    section: Joi.string().required(),
    content: Joi.string().required(),
    feedback: Joi.string().min(10).max(1000).required(),
  }),

  createFromAI: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    aiResponse: Joi.object({
      content: Joi.string().required(),
      sections: Joi.object().required(),
      suggestions: Joi.array().items(Joi.string()).required(),
      metadata: Joi.object().required(),
    }).required(),
    teamId: Joi.string().uuid().optional(),
    visibility: Joi.string().valid('private', 'team', 'public').default('private'),
    templateId: Joi.string().uuid().optional(),
  }),
};

// Export all schemas grouped by domain
export const validationSchemas = {
  auth: authSchemas,
  team: teamSchemas,
  prd: prdSchemas,
  analytics: analyticsSchemas,
  template: templateSchemas,
  comment: commentSchemas,
  onboarding: onboardingSchemas,
  file: fileSchemas,
  notification: notificationSchemas,
  collaboration: collaborationSchemas,
  ai: aiSchemas,
};

// Export legacy schemas for backward compatibility (to be removed)
export const {
  register: registerSchema,
  login: loginSchema,
} = authSchemas;

export const {
  create: createTeamSchema,
  inviteMember: inviteMemberSchema,
  updateMemberRole: updateMemberRoleSchema,
} = teamSchemas;

export const {
  create: createPRDSchema,
  update: updatePRDSchema,
  filters: prdFiltersSchema,
} = prdSchemas;

export const {
  create: createTemplateSchema,
} = templateSchemas;
