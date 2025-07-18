import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  if (env.NODE_ENV === 'development') {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, url, ip } = req;
      const { statusCode } = res;
      
      const logColor = statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // Red for errors, green for success
      const resetColor = '\x1b[0m';
      
      console.log(
        `${logColor}${method} ${url} ${statusCode} - ${duration}ms${resetColor} ${ip}`
      );
    });
  }
  
  next();
};