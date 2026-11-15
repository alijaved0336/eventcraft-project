import { type Request, type Response, type NextFunction } from 'express';
import { ZodError, type ZodIssue } from 'zod';
import { AppError } from '../errors';
import { logger } from '../lib/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    (res as any).status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.issues
        .map((e: ZodIssue) => ({
          path: e.path.join('.'),
          message: e.message,
        }))
        .filter((obj, index, self) => index === self.findIndex((t) => t.path === obj.path)),
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    (res as any).status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
    return;
  }

  // Unknown errors — log full stack, return generic message
  const statusCode = (err as any).status || (err as any).statusCode || 500;
  
  logger.error('Unhandled error', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    path: (req as any).path,
    method: (req as any).method,
    statusCode,
  });

  (res as any).status(statusCode).json({
    success: false,
    code: (err as any).code || 'INTERNAL_ERROR',
    message: statusCode === 500 ? 'Something went wrong' : (err as Error).message || 'An error occurred',
  });
}
