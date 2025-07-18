import Joi from 'joi';

// User validation schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(6).max(128).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Team validation schemas
export const createTeamSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
});

export const inviteMemberSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const updateMemberRoleSchema = Joi.object({
  role: Joi.string().valid('owner', 'admin', 'member').required(),
});

// PRD validation schemas
export const createPRDSchema = Joi.object({
  title: Joi.string().min(1).max(500).required(),
  content: Joi.string().min(1).required(),
  teamId: Joi.string().uuid().optional(),
  visibility: Joi.string().valid('private', 'team', 'public').default('private'),
  metadata: Joi.object().optional(),
  templateId: Joi.string().uuid().optional(),
});

export const updatePRDSchema = Joi.object({
  title: Joi.string().min(1).max(500).optional(),
  content: Joi.string().min(1).optional(),
  visibility: Joi.string().valid('private', 'team', 'public').optional(),
  metadata: Joi.object().optional(),
});

export const prdFiltersSchema = Joi.object({
  search: Joi.string().max(255).optional(),
  author: Joi.string().max(255).optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  templateId: Joi.string().uuid().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// Template validation schemas
export const createTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  structure: Joi.object({
    questions: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        label: Joi.string().required(),
        type: Joi.string().valid('text', 'textarea', 'select').required(),
        placeholder: Joi.string().optional(),
        options: Joi.array().items(Joi.string()).optional(),
        required: Joi.boolean().required(),
      })
    ).required(),
    sections: Joi.array().items(Joi.string()).required(),
  }).required(),
  industry: Joi.string().max(100).optional(),
  isPublic: Joi.boolean().default(false),
});

// Helper function to validate request body
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errorDetails,
      });
    }

    req.body = value;
    next();
  };
};

// Helper function to validate query parameters
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errorDetails,
      });
    }

    req.query = value;
    next();
  };
};