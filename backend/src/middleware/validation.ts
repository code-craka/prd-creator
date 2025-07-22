import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import Joi from 'joi';

/**
 * Unified validation middleware that supports both Joi schemas and express-validator chains
 * This eliminates duplication and provides a consistent validation interface
 */

// Generic validation error interface
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Validation target type
type ValidationTarget = 'body' | 'query' | 'params' | 'headers';

/**
 * Main validation middleware factory that works with Joi schemas
 * @param schema - Joi schema to validate against
 * @param target - Part of request to validate (body, query, params, headers)
 * @param options - Additional validation options
 */
export const validate = (
  schema: Joi.ObjectSchema, 
  target: ValidationTarget = 'body',
  options: {
    allowUnknown?: boolean;
    stripUnknown?: boolean;
    abortEarly?: boolean;
  } = {}
) => {
  const {
    allowUnknown = false,
    stripUnknown = true,
    abortEarly = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[target], {
      allowUnknown,
      stripUnknown,
      abortEarly,
    });

    if (error) {
      const errorDetails: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errorDetails,
      });
    }

    // Replace the original data with validated and sanitized data
    req[target] = value;
    next();
  };
};

/**
 * Convenience helpers for different validation targets
 */
export const validateBody = (schema: Joi.ObjectSchema, options?: any) => 
  validate(schema, 'body', options);

export const validateQuery = (schema: Joi.ObjectSchema, options?: any) => 
  validate(schema, 'query', options);

export const validateParams = (schema: Joi.ObjectSchema, options?: any) => 
  validate(schema, 'params', options);

export const validateHeaders = (schema: Joi.ObjectSchema, options?: any) => 
  validate(schema, 'headers', options);

/**
 * Express-validator middleware factory (for express-validator chains)
 * This is kept for backward compatibility with existing code
 */
export const validateRequest = (_validationRules?: ValidationChain[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorDetails: ValidationError[] = errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : error.type,
        message: error.msg,
        value: (error as any).value
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errorDetails,
      });
    }

    next();
  };
};

/**
 * Multi-target validation middleware for complex endpoints
 * Validates multiple parts of the request with different schemas
 */
export const validateMultiple = (validations: Array<{
  schema: Joi.ObjectSchema;
  target: ValidationTarget;
  options?: any;
}>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const allErrors: ValidationError[] = [];

    for (const { schema, target, options = {} } of validations) {
      const { error, value } = schema.validate(req[target], {
        allowUnknown: false,
        stripUnknown: true,
        abortEarly: false,
        ...options,
      });

      if (error) {
        const errorDetails: ValidationError[] = error.details.map(detail => ({
          field: `${target}.${detail.path.join('.')}`,
          message: detail.message,
          value: detail.context?.value,
        }));
        allErrors.push(...errorDetails);
      } else {
        // Update request with validated data
        req[target] = value;
      }
    }

    if (allErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: allErrors,
      });
    }

    next();
  };
};

/**
 * Conditional validation middleware
 * Only validates if condition is met
 */
export const validateIf = (
  condition: (req: Request) => boolean,
  schema: Joi.ObjectSchema,
  target: ValidationTarget = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!condition(req)) {
      return next();
    }
    
    return validate(schema, target)(req, res, next);
  };
};

/**
 * Schema composition helpers for building complex validations
 */
export const composeSchemas = {
  /**
   * Merge multiple schemas into one
   */
  merge: (...schemas: Joi.ObjectSchema[]) => {
    return schemas.reduce((merged, schema) => merged.concat(schema));
  },

  /**
   * Create optional version of a schema
   */
  optional: (schema: Joi.ObjectSchema) => {
    return schema.fork(Object.keys(schema.describe().keys), (field) => field.optional());
  },

  /**
   * Add pagination to any schema
   */
  withPagination: (schema: Joi.ObjectSchema) => {
    return schema.keys({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    });
  },

  /**
   * Add search capability to any schema
   */
  withSearch: (schema: Joi.ObjectSchema) => {
    return schema.keys({
      search: Joi.string().max(255).optional(),
    });
  },

  /**
   * Add date range filters to any schema
   */
  withDateRange: (schema: Joi.ObjectSchema) => {
    return schema.keys({
      dateFrom: Joi.date().iso().optional(),
      dateTo: Joi.date().iso().optional(),
    });
  },
};

/**
 * Error formatting utilities
 */
export const formatValidationError = (error: Joi.ValidationError): ValidationError[] => {
  return error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
    value: detail.context?.value,
  }));
};

/**
 * Custom validation helpers
 */
export const customValidators = {
  /**
   * Validate that one field is present when another is present
   */
  requiredWith: (fieldName: string, dependentField: string) => {
    return Joi.when(dependentField, {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional(),
    });
  },

  /**
   * Validate that a field is a valid UUID array
   */
  uuidArray: (min = 0, max = 100) => {
    return Joi.array().items(Joi.string().uuid()).min(min).max(max);
  },

  /**
   * Validate file size in bytes
   */
  fileSize: (maxSizeInMB: number) => {
    return Joi.number().max(maxSizeInMB * 1024 * 1024);
  },

  /**
   * Validate that end date is after start date
   */
  dateRange: () => {
    return Joi.object({
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    });
  },
};