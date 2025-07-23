/**
 * Standardized error handling utilities to eliminate error handling duplication
 */

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(
    message: string, 
    statusCode = 500, 
    isOperational = true,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, true, 'UNAUTHORIZED');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400, true, 'VALIDATION_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, true, 'CONFLICT');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, true, 'FORBIDDEN');
  }
}

/**
 * Factory functions for common error scenarios
 */
export const ErrorFactory = {
  notFound: (resource: string) => new NotFoundError(resource),
  unauthorized: (message?: string) => new UnauthorizedError(message),
  validation: (message: string) => new ValidationError(message),
  conflict: (message: string) => new ConflictError(message),
  forbidden: (message?: string) => new ForbiddenError(message),
  
  // Common entity-specific errors
  userNotFound: () => new NotFoundError('User'),
  teamNotFound: () => new NotFoundError('Team'),
  prdNotFound: () => new NotFoundError('PRD'),
  templateNotFound: () => new NotFoundError('Template'),
  blogPostNotFound: () => new NotFoundError('Blog post'),
  campaignNotFound: () => new NotFoundError('Campaign'),
  rewardNotFound: () => new NotFoundError('Reward'),
  
  // Authorization errors
  unauthorizedAccess: () => new UnauthorizedError('Unauthorized access to this resource'),
  teamAccessDenied: () => new ForbiddenError('Access denied to team resource'),
  prdAccessDenied: () => new ForbiddenError('Access denied to PRD'),
  
  // Validation errors
  invalidEmail: () => new ValidationError('Invalid email address'),
  passwordTooShort: () => new ValidationError('Password must be at least 6 characters'),
  requiredField: (field: string) => new ValidationError(`${field} is required`),
  
  // Conflict errors
  emailExists: () => new ConflictError('Email already exists'),
  teamNameExists: () => new ConflictError('Team name already exists'),
  templateExists: () => new ConflictError('Template already exists')
};

/**
 * Error conversion helper
 */
function convertDatabaseError(error: Error): AppError {
  const message = error.message;
  
  if (message.includes('duplicate key')) {
    return new ConflictError('Resource already exists');
  }
  if (message.includes('foreign key constraint')) {
    return new ValidationError('Referenced resource does not exist');
  }
  if (message.includes('not null constraint')) {
    return new ValidationError('Required field is missing');
  }
  
  return new AppError(message, 500, false);
}

/**
 * Simplified async wrapper to catch and standardize errors
 */
export function asyncHandler<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw convertDatabaseError(error);
      }
      
      throw new AppError('Internal server error', 500, false);
    }
  };
}

/**
 * Common validation helpers
 */
export const ValidationHelpers = {
  validateEmail: (email: string): void => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw ErrorFactory.invalidEmail();
    }
  },

  validatePassword: (password: string): void => {
    if (!password || password.length < 6) {
      throw ErrorFactory.passwordTooShort();
    }
  },

  validateRequired: (value: unknown, fieldName: string): void => {
    const isEmpty = value === null || value === undefined || value === '';
    if (isEmpty) {
      throw ErrorFactory.requiredField(fieldName);
    }
  },

  validateUUID: (value: string, fieldName = 'ID'): void => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new ValidationError(`Invalid ${fieldName} format`);
    }
  },

  validatePositiveInteger: (value: number, fieldName: string): void => {
    if (!Number.isInteger(value) || value <= 0) {
      throw new ValidationError(`${fieldName} must be a positive integer`);
    }
  },

  validateArrayNotEmpty: (array: unknown[], fieldName: string): void => {
    if (!Array.isArray(array) || array.length === 0) {
      throw new ValidationError(`${fieldName} must be a non-empty array`);
    }
  }
};

/**
 * Error logging utility
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    ...(error instanceof AppError ? {
      statusCode: error.statusCode,
      code: error.code,
      isOperational: error.isOperational
    } : {}),
    ...context
  });
}

/**
 * Express error handler
 */
export function errorHandler(
  error: Error, 
  req: { method: string; url: string; user?: { id: string } }, 
  res: { status: (code: number) => { json: (data: unknown) => void } }
): void {
  logError(error, {
    method: req.method,
    url: req.url,
    userId: req.user?.id
  });

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code
    });
    return;
  }

  // Unexpected error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
}
