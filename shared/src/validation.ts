/**
 * Shared validation schemas between frontend and backend
 * This file contains TypeScript interfaces and Zod schemas that ensure
 * consistent   bulkActions: z.object({
    prdIds: z.array(commonValidators.id).min(1, 'At least one PRD required').max(50, 'Too many PRDs'),
    operation: z.enum(['delete', 'archive', 'updateVisibility'], {
      errorMap: () => ({ message: 'Invalid operation' })
    }),
    data: z.record(z.unknown()).optional(),
  }),ion rules across client and server
 */

import { z } from 'zod';

// ================================
// COMMON FIELD VALIDATORS
// ================================

export const commonValidators = {
  id: z.string().uuid('Invalid ID format'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  visibility: z.enum(['private', 'team', 'public'], { errorMap: () => ({ message: 'Invalid visibility option' }) }),
  role: z.enum(['owner', 'admin', 'member'], { errorMap: () => ({ message: 'Invalid role' }) }),
  
  // Pagination
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit too high').default(20),
  
  // Dates
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  
  // Search
  search: z.string().max(255, 'Search query too long').optional(),
};

// ================================
// AUTH SCHEMAS
// ================================

export const authSchemas = {
  register: z.object({
    email: commonValidators.email,
    name: commonValidators.name,
    password: commonValidators.password,
  }),

  registerWithConfirm: z.object({
    email: commonValidators.email,
    name: commonValidators.name,
    password: commonValidators.password,
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),

  login: z.object({
    email: commonValidators.email,
    password: z.string().min(1, 'Password is required'),
  }),

  resetPassword: z.object({
    email: commonValidators.email,
  }),

  updatePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: commonValidators.password,
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
};

// ================================
// TEAM SCHEMAS
// ================================

export const teamSchemas = {
  create: z.object({
    name: commonValidators.name,
    description: z.string().max(500, 'Description too long').optional(),
  }),

  update: z.object({
    name: commonValidators.name.optional(),
    description: z.string().max(500, 'Description too long').optional(),
  }),

  inviteMember: z.object({
    email: commonValidators.email,
    role: commonValidators.role.default('member'),
  }),

  updateMemberRole: z.object({
    role: commonValidators.role,
  }),

  filters: z.object({
    search: commonValidators.search,
    page: commonValidators.page,
    limit: commonValidators.limit,
  }),
};

// ================================
// PRD SCHEMAS
// ================================

export const prdSchemas = {
    create: z.object({
    title: commonValidators.nonEmptyString,
    content: z.string().min(1, 'Content is required'),
    teamId: commonValidators.id.optional(),
    visibility: z.enum(['private', 'team', 'public']).default('private'),
    metadata: z.record(z.unknown()).optional(),
    templateId: commonValidators.id.optional(),
  }),

  update: z.object({
    title: commonValidators.title.optional(),
    content: commonValidators.content.optional(),
    visibility: commonValidators.visibility.optional(),
    metadata: z.record(z.unknown()).optional(),
    tags: z.array(z.string().max(50, 'Tag too long')).max(10, 'Too many tags').optional(),
  }),

  filters: z.object({
    search: commonValidators.search,
    author: z.string().max(255, 'Author filter too long').optional(),
    dateFrom: commonValidators.dateFrom,
    dateTo: commonValidators.dateTo,
    templateId: commonValidators.id.optional(),
    visibility: commonValidators.visibility.optional(),
    teamId: commonValidators.id.optional(),
    tags: z.array(z.string()).optional(),
    page: commonValidators.page,
    limit: commonValidators.limit,
  }).refine((data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateFrom <= data.dateTo;
    }
    return true;
  }, {
    message: 'End date must be after start date',
    path: ['dateTo'],
  }),

  bulkOperation: z.object({
    prdIds: z.array(commonValidators.id).min(1, 'At least one PRD required').max(50, 'Too many PRDs'),
    operation: z.enum(['delete', 'archive', 'updateVisibility'], {
      errorMap: () => ({ message: 'Invalid operation' })
    }),
    data: z.record(z.any()).optional(),
  }),
};

// ================================
// ANALYTICS SCHEMAS
// ================================

export const analyticsSchemas = {
  trackEvent: z.object({
    eventType: z.string().min(1, 'Event type is required'),
    eventCategory: z.string().min(1, 'Event category is required'),
    eventData: z.record(z.unknown()).optional(),
    prdId: commonValidators.id.optional(),
    sessionId: z.string().optional(),
    timestamp: z.coerce.date().optional(),
  }),

  query: z.object({
    timeRange: z.enum(['7d', '30d', '90d', '6m', '1y'], {
      errorMap: () => ({ message: 'Invalid time range' })
    }).default('30d'),
    teamId: commonValidators.id.optional(),
    eventType: z.string().optional(),
    eventCategory: z.string().optional(),
    prdId: commonValidators.id.optional(),
    page: commonValidators.page,
    limit: commonValidators.limit,
  }),

  dashboard: z.object({
    timeRange: z.enum(['7d', '30d', '90d'], {
      errorMap: () => ({ message: 'Invalid time range' })
    }).default('30d'),
    teamId: commonValidators.id.optional(),
  }),
};

// ================================
// TEMPLATE SCHEMAS
// ================================

const questionSchema = z.object({
  id: z.string().min(1, 'Question ID is required'),
  label: z.string().min(1, 'Question label is required'),
  type: z.enum(['text', 'textarea', 'select', 'checkbox', 'radio'], {
    errorMap: () => ({ message: 'Invalid question type' })
  }),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
  validation: z.object({
    minLength: z.number().min(0).optional(),
    maxLength: z.number().min(1).optional(),
    pattern: z.string().optional(),
  }).optional(),
});

export const templateSchemas = {
  create: z.object({
    name: z.string().min(1, 'Template name is required').max(255, 'Name too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    structure: z.object({
      questions: z.array(questionSchema).min(1, 'At least one question required'),
      sections: z.array(z.string()).min(1, 'At least one section required'),
    }),
    industry: z.string().max(100, 'Industry name too long').optional(),
    isPublic: z.boolean().default(false),
    tags: z.array(z.string().max(50, 'Tag too long')).max(10, 'Too many tags').optional(),
  }),

  update: z.object({
    name: z.string().min(1, 'Template name is required').max(255, 'Name too long').optional(),
    description: z.string().max(1000, 'Description too long').optional(),
    structure: z.object({
      questions: z.array(questionSchema).optional(),
      sections: z.array(z.string()).optional(),
    }).optional(),
    industry: z.string().max(100, 'Industry name too long').optional(),
    isPublic: z.boolean().optional(),
    tags: z.array(z.string().max(50, 'Tag too long')).max(10, 'Too many tags').optional(),
  }),

  filters: z.object({
    search: commonValidators.search,
    industry: z.string().max(100, 'Industry filter too long').optional(),
    isPublic: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    page: commonValidators.page,
    limit: commonValidators.limit,
  }),
};

// ================================
// COMMENT SCHEMAS
// ================================

export const commentSchemas = {
  create: z.object({
    content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
    section: z.string().min(1, 'Section is required'),
    position: z.number().min(0, 'Position must be non-negative'),
    parentId: commonValidators.id.optional(),
  }),

  update: z.object({
    content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
  }),

  resolve: z.object({
    resolved: z.boolean(),
  }),
};

// ================================
// COLLABORATION SCHEMAS
// ================================

export const collaborationSchemas = {
  operation: z.object({
    type: z.enum(['insert', 'delete', 'replace'], {
      errorMap: () => ({ message: 'Invalid operation type' })
    }),
    section: z.string().min(1, 'Section is required'),
    position: z.number().min(0, 'Position must be non-negative'),
    content: z.string().optional(),
    length: z.number().min(0, 'Length must be non-negative').optional(),
  }),

  presence: z.object({
    type: z.enum(['cursor', 'selection', 'typing', 'idle'], {
      errorMap: () => ({ message: 'Invalid presence type' })
    }),
    data: z.object({
      section: z.string().optional(),
      position: z.number().min(0).optional(),
      start: z.number().min(0).optional(),
      end: z.number().min(0).optional(),
      isTyping: z.boolean().optional(),
    }),
  }),
};

// ================================
// FILE UPLOAD SCHEMAS
// ================================

export const fileSchemas = {
  upload: z.object({
    type: z.enum(['avatar', 'document', 'template'], {
      errorMap: () => ({ message: 'Invalid file type' })
    }),
    filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
    contentType: z.enum([
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/markdown'
    ], {
      errorMap: () => ({ message: 'Invalid file type' })
    }),
    size: z.number().max(10 * 1024 * 1024, 'File too large (max 10MB)'),
  }),
};

// ================================
// ONBOARDING SCHEMAS
// ================================

export const onboardingSchemas = {
  updateStep: z.object({
    step: z.enum(['account_setup', 'team_creation', 'first_prd', 'collaboration', 'completed'], {
      errorMap: () => ({ message: 'Invalid onboarding step' })
    }),
    data: z.record(z.unknown()).optional(),
  }),

  completeOnboarding: z.object({
    feedback: z.string().max(1000, 'Feedback too long').optional(),
    rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
  }),
};

// ================================
// NOTIFICATION SCHEMAS
// ================================

export const notificationSchemas = {
  create: z.object({
    type: z.enum(['comment', 'mention', 'invite', 'update'], {
      errorMap: () => ({ message: 'Invalid notification type' })
    }),
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
    recipientId: commonValidators.id,
    metadata: z.record(z.unknown()).optional(),
  }),

  markRead: z.object({
    notificationIds: z.array(commonValidators.id).min(1, 'At least one notification required').max(100, 'Too many notifications'),
  }),

  filters: z.object({
    type: z.enum(['comment', 'mention', 'invite', 'update'], {
      errorMap: () => ({ message: 'Invalid notification type' })
    }).optional(),
    read: z.boolean().optional(),
    page: commonValidators.page,
    limit: commonValidators.limit,
  }),
};

// ================================
// EXPORT ALL SCHEMAS
// ================================

export const sharedValidationSchemas = {
  auth: authSchemas,
  team: teamSchemas,
  prd: prdSchemas,
  analytics: analyticsSchemas,
  template: templateSchemas,
  comment: commentSchemas,
  collaboration: collaborationSchemas,
  file: fileSchemas,
  onboarding: onboardingSchemas,
  notification: notificationSchemas,
};

// ================================
// TYPE INFERENCE HELPERS
// ================================

// Extract types from schemas for TypeScript
export type AuthRegisterData = z.infer<typeof authSchemas.register>;
export type AuthLoginData = z.infer<typeof authSchemas.login>;
export type TeamCreateData = z.infer<typeof teamSchemas.create>;
export type TeamUpdateData = z.infer<typeof teamSchemas.update>;
export type PRDCreateData = z.infer<typeof prdSchemas.create>;
export type PRDUpdateData = z.infer<typeof prdSchemas.update>;
export type PRDFiltersData = z.infer<typeof prdSchemas.filters>;
export type TemplateCreateData = z.infer<typeof templateSchemas.create>;
export type CommentCreateData = z.infer<typeof commentSchemas.create>;
export type AnalyticsEventData = z.infer<typeof analyticsSchemas.trackEvent>;

// Form data types (with additional fields for frontend forms)
export type RegisterFormData = z.infer<typeof authSchemas.registerWithConfirm>;
export type UpdatePasswordFormData = z.infer<typeof authSchemas.updatePassword>;

// ================================
// VALIDATION HELPERS
// ================================

/**
 * Validate data against a schema and return typed result
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { 
      success: false, 
      errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
    };
  }
}

/**
 * Create a validation function for a specific schema
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return (data: unknown) => validateData(schema, data);
}
