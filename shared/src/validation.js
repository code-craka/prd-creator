"use strict";
/**
 * Shared validation schemas between frontend and backend
 * This file contains TypeScript interfaces and Zod schemas that ensure
 * consistent validation rules across client and server
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharedValidationSchemas = exports.notificationSchemas = exports.onboardingSchemas = exports.fileSchemas = exports.collaborationSchemas = exports.commentSchemas = exports.templateSchemas = exports.analyticsSchemas = exports.prdSchemas = exports.teamSchemas = exports.authSchemas = exports.commonValidators = void 0;
exports.validateData = validateData;
exports.createValidator = createValidator;
const zod_1 = require("zod");
// ================================
// COMMON FIELD VALIDATORS
// ================================
exports.commonValidators = {
    id: zod_1.z.string().uuid('Invalid ID format'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    title: zod_1.z.string().min(1, 'Title is required').max(500, 'Title too long'),
    content: zod_1.z.string().min(1, 'Content is required'),
    visibility: zod_1.z.enum(['private', 'team', 'public'], { errorMap: () => ({ message: 'Invalid visibility option' }) }),
    role: zod_1.z.enum(['owner', 'admin', 'member'], { errorMap: () => ({ message: 'Invalid role' }) }),
    // Pagination
    page: zod_1.z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
    limit: zod_1.z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit too high').default(20),
    // Dates
    dateFrom: zod_1.z.coerce.date().optional(),
    dateTo: zod_1.z.coerce.date().optional(),
    // Search
    search: zod_1.z.string().max(255, 'Search query too long').optional(),
};
// ================================
// AUTH SCHEMAS
// ================================
exports.authSchemas = {
    register: zod_1.z.object({
        email: exports.commonValidators.email,
        name: exports.commonValidators.name,
        password: exports.commonValidators.password,
    }),
    registerWithConfirm: zod_1.z.object({
        email: exports.commonValidators.email,
        name: exports.commonValidators.name,
        password: exports.commonValidators.password,
        confirmPassword: zod_1.z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    }),
    login: zod_1.z.object({
        email: exports.commonValidators.email,
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
    resetPassword: zod_1.z.object({
        email: exports.commonValidators.email,
    }),
    updatePassword: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, 'Current password is required'),
        newPassword: exports.commonValidators.password,
        confirmPassword: zod_1.z.string(),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    }),
};
// ================================
// TEAM SCHEMAS
// ================================
exports.teamSchemas = {
    create: zod_1.z.object({
        name: exports.commonValidators.name,
        description: zod_1.z.string().max(500, 'Description too long').optional(),
    }),
    update: zod_1.z.object({
        name: exports.commonValidators.name.optional(),
        description: zod_1.z.string().max(500, 'Description too long').optional(),
    }),
    inviteMember: zod_1.z.object({
        email: exports.commonValidators.email,
        role: exports.commonValidators.role.default('member'),
    }),
    updateMemberRole: zod_1.z.object({
        role: exports.commonValidators.role,
    }),
    filters: zod_1.z.object({
        search: exports.commonValidators.search,
        page: exports.commonValidators.page,
        limit: exports.commonValidators.limit,
    }),
};
// ================================
// PRD SCHEMAS
// ================================
exports.prdSchemas = {
    create: zod_1.z.object({
        title: exports.commonValidators.title,
        content: exports.commonValidators.content,
        teamId: exports.commonValidators.id.optional(),
        visibility: exports.commonValidators.visibility.default('private'),
        metadata: zod_1.z.record(zod_1.z.any()).optional(),
        templateId: exports.commonValidators.id.optional(),
        tags: zod_1.z.array(zod_1.z.string().max(50, 'Tag too long')).max(10, 'Too many tags').optional(),
    }),
    update: zod_1.z.object({
        title: exports.commonValidators.title.optional(),
        content: exports.commonValidators.content.optional(),
        visibility: exports.commonValidators.visibility.optional(),
        metadata: zod_1.z.record(zod_1.z.any()).optional(),
        tags: zod_1.z.array(zod_1.z.string().max(50, 'Tag too long')).max(10, 'Too many tags').optional(),
    }),
    filters: zod_1.z.object({
        search: exports.commonValidators.search,
        author: zod_1.z.string().max(255, 'Author filter too long').optional(),
        dateFrom: exports.commonValidators.dateFrom,
        dateTo: exports.commonValidators.dateTo,
        templateId: exports.commonValidators.id.optional(),
        visibility: exports.commonValidators.visibility.optional(),
        teamId: exports.commonValidators.id.optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        page: exports.commonValidators.page,
        limit: exports.commonValidators.limit,
    }).refine((data) => {
        if (data.dateFrom && data.dateTo) {
            return data.dateFrom <= data.dateTo;
        }
        return true;
    }, {
        message: 'End date must be after start date',
        path: ['dateTo'],
    }),
    bulkOperation: zod_1.z.object({
        prdIds: zod_1.z.array(exports.commonValidators.id).min(1, 'At least one PRD required').max(50, 'Too many PRDs'),
        operation: zod_1.z.enum(['delete', 'archive', 'updateVisibility'], {
            errorMap: () => ({ message: 'Invalid operation' })
        }),
        data: zod_1.z.record(zod_1.z.any()).optional(),
    }),
};
// ================================
// ANALYTICS SCHEMAS
// ================================
exports.analyticsSchemas = {
    trackEvent: zod_1.z.object({
        eventType: zod_1.z.string().min(1, 'Event type is required'),
        eventCategory: zod_1.z.string().min(1, 'Event category is required'),
        eventData: zod_1.z.record(zod_1.z.any()).optional(),
        prdId: exports.commonValidators.id.optional(),
        sessionId: zod_1.z.string().optional(),
        timestamp: zod_1.z.coerce.date().optional(),
    }),
    query: zod_1.z.object({
        timeRange: zod_1.z.enum(['7d', '30d', '90d', '6m', '1y'], {
            errorMap: () => ({ message: 'Invalid time range' })
        }).default('30d'),
        teamId: exports.commonValidators.id.optional(),
        eventType: zod_1.z.string().optional(),
        eventCategory: zod_1.z.string().optional(),
        prdId: exports.commonValidators.id.optional(),
        page: exports.commonValidators.page,
        limit: exports.commonValidators.limit,
    }),
    dashboard: zod_1.z.object({
        timeRange: zod_1.z.enum(['7d', '30d', '90d'], {
            errorMap: () => ({ message: 'Invalid time range' })
        }).default('30d'),
        teamId: exports.commonValidators.id.optional(),
    }),
};
// ================================
// TEMPLATE SCHEMAS
// ================================
const questionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'Question ID is required'),
    label: zod_1.z.string().min(1, 'Question label is required'),
    type: zod_1.z.enum(['text', 'textarea', 'select', 'checkbox', 'radio'], {
        errorMap: () => ({ message: 'Invalid question type' })
    }),
    placeholder: zod_1.z.string().optional(),
    options: zod_1.z.array(zod_1.z.string()).optional(),
    required: zod_1.z.boolean().default(false),
    validation: zod_1.z.object({
        minLength: zod_1.z.number().min(0).optional(),
        maxLength: zod_1.z.number().min(1).optional(),
        pattern: zod_1.z.string().optional(),
    }).optional(),
});
exports.templateSchemas = {
    create: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Template name is required').max(255, 'Name too long'),
        description: zod_1.z.string().max(1000, 'Description too long').optional(),
        structure: zod_1.z.object({
            questions: zod_1.z.array(questionSchema).min(1, 'At least one question required'),
            sections: zod_1.z.array(zod_1.z.string()).min(1, 'At least one section required'),
        }),
        industry: zod_1.z.string().max(100, 'Industry name too long').optional(),
        isPublic: zod_1.z.boolean().default(false),
        tags: zod_1.z.array(zod_1.z.string().max(50, 'Tag too long')).max(10, 'Too many tags').optional(),
    }),
    update: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Template name is required').max(255, 'Name too long').optional(),
        description: zod_1.z.string().max(1000, 'Description too long').optional(),
        structure: zod_1.z.object({
            questions: zod_1.z.array(questionSchema).optional(),
            sections: zod_1.z.array(zod_1.z.string()).optional(),
        }).optional(),
        industry: zod_1.z.string().max(100, 'Industry name too long').optional(),
        isPublic: zod_1.z.boolean().optional(),
        tags: zod_1.z.array(zod_1.z.string().max(50, 'Tag too long')).max(10, 'Too many tags').optional(),
    }),
    filters: zod_1.z.object({
        search: exports.commonValidators.search,
        industry: zod_1.z.string().max(100, 'Industry filter too long').optional(),
        isPublic: zod_1.z.boolean().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        page: exports.commonValidators.page,
        limit: exports.commonValidators.limit,
    }),
};
// ================================
// COMMENT SCHEMAS
// ================================
exports.commentSchemas = {
    create: zod_1.z.object({
        content: zod_1.z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
        section: zod_1.z.string().min(1, 'Section is required'),
        position: zod_1.z.number().min(0, 'Position must be non-negative'),
        parentId: exports.commonValidators.id.optional(),
    }),
    update: zod_1.z.object({
        content: zod_1.z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
    }),
    resolve: zod_1.z.object({
        resolved: zod_1.z.boolean(),
    }),
};
// ================================
// COLLABORATION SCHEMAS
// ================================
exports.collaborationSchemas = {
    operation: zod_1.z.object({
        type: zod_1.z.enum(['insert', 'delete', 'replace'], {
            errorMap: () => ({ message: 'Invalid operation type' })
        }),
        section: zod_1.z.string().min(1, 'Section is required'),
        position: zod_1.z.number().min(0, 'Position must be non-negative'),
        content: zod_1.z.string().optional(),
        length: zod_1.z.number().min(0, 'Length must be non-negative').optional(),
    }),
    presence: zod_1.z.object({
        type: zod_1.z.enum(['cursor', 'selection', 'typing', 'idle'], {
            errorMap: () => ({ message: 'Invalid presence type' })
        }),
        data: zod_1.z.object({
            section: zod_1.z.string().optional(),
            position: zod_1.z.number().min(0).optional(),
            start: zod_1.z.number().min(0).optional(),
            end: zod_1.z.number().min(0).optional(),
            isTyping: zod_1.z.boolean().optional(),
        }),
    }),
};
// ================================
// FILE UPLOAD SCHEMAS
// ================================
exports.fileSchemas = {
    upload: zod_1.z.object({
        type: zod_1.z.enum(['avatar', 'document', 'template'], {
            errorMap: () => ({ message: 'Invalid file type' })
        }),
        filename: zod_1.z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
        contentType: zod_1.z.enum([
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
        size: zod_1.z.number().max(10 * 1024 * 1024, 'File too large (max 10MB)'),
    }),
};
// ================================
// ONBOARDING SCHEMAS
// ================================
exports.onboardingSchemas = {
    updateStep: zod_1.z.object({
        step: zod_1.z.enum(['account_setup', 'team_creation', 'first_prd', 'collaboration', 'completed'], {
            errorMap: () => ({ message: 'Invalid onboarding step' })
        }),
        data: zod_1.z.record(zod_1.z.any()).optional(),
    }),
    completeOnboarding: zod_1.z.object({
        feedback: zod_1.z.string().max(1000, 'Feedback too long').optional(),
        rating: zod_1.z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
    }),
};
// ================================
// NOTIFICATION SCHEMAS
// ================================
exports.notificationSchemas = {
    create: zod_1.z.object({
        type: zod_1.z.enum(['comment', 'mention', 'invite', 'update'], {
            errorMap: () => ({ message: 'Invalid notification type' })
        }),
        title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title too long'),
        message: zod_1.z.string().min(1, 'Message is required').max(1000, 'Message too long'),
        recipientId: exports.commonValidators.id,
        metadata: zod_1.z.record(zod_1.z.any()).optional(),
    }),
    markRead: zod_1.z.object({
        notificationIds: zod_1.z.array(exports.commonValidators.id).min(1, 'At least one notification required').max(100, 'Too many notifications'),
    }),
    filters: zod_1.z.object({
        type: zod_1.z.enum(['comment', 'mention', 'invite', 'update'], {
            errorMap: () => ({ message: 'Invalid notification type' })
        }).optional(),
        read: zod_1.z.boolean().optional(),
        page: exports.commonValidators.page,
        limit: exports.commonValidators.limit,
    }),
};
// ================================
// EXPORT ALL SCHEMAS
// ================================
exports.sharedValidationSchemas = {
    auth: exports.authSchemas,
    team: exports.teamSchemas,
    prd: exports.prdSchemas,
    analytics: exports.analyticsSchemas,
    template: exports.templateSchemas,
    comment: exports.commentSchemas,
    collaboration: exports.collaborationSchemas,
    file: exports.fileSchemas,
    onboarding: exports.onboardingSchemas,
    notification: exports.notificationSchemas,
};
// ================================
// VALIDATION HELPERS
// ================================
/**
 * Validate data against a schema and return typed result
 */
function validateData(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    else {
        return {
            success: false,
            errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
    }
}
/**
 * Create a validation function for a specific schema
 */
function createValidator(schema) {
    return (data) => validateData(schema, data);
}
//# sourceMappingURL=validation.js.map