import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

// Express-validator middleware factory (for express-validator chains)
export const validateRequest = (validationRules?: ValidationChain[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors.array().map(error => ({
          field: error.type === 'field' ? (error as any).path : error.type,
          message: error.msg,
          value: (error as any).value
        }))
      });
    }

    next();
  };
};

// Re-export Joi validation helpers for consistency
export { validate, validateBody, validateQuery, validateParams } from '../utils/validation';