import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token.util';
import { isBlacklisted } from '../utils/tokenBlacklist.util';
import { AuthErrorCodes } from '../modules/auth/auth.errors';
import { logger } from '../lib/logger';

/**
 * Custom request interface to include our specific user payload.
 * We use 'any' for the user property to avoid conflicts with global Express/Passport definitions.
 */
export interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Standard authentication middleware:
 * 1. Extracts Bearer token
 * 2. Verifies JWT signature
 * 3. Checks Redis blacklist for JTI (logout check)
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ code: AuthErrorCodes.UNAUTHENTICATED });
    return;
  }

  const token = authHeader.split(' ')[1] as string;

  try {
    const payload = verifyAccessToken(token);

    // Redis check for blacklisted access tokens
    if (await isBlacklisted(payload.jti)) {
      res.status(401).json({ code: AuthErrorCodes.ACCESS_TOKEN_BLACKLISTED });
      return;
    }

    req.user = {
      id: payload.userId,
      role: payload.role,
      permissions: payload.permissions,
    };

    next();
  } catch (err) {
    logger.warn('Authentication failed', { err: (err as Error).message });
    res.status(401).json({ code: AuthErrorCodes.INVALID_ACCESS_TOKEN });
  }
}

/**
 * Optional identification (doesn't throw if missing)
 */
export async function optionalAuthenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1] as string;

  try {
    const payload = verifyAccessToken(token);
    if (!(await isBlacklisted(payload.jti))) {
      req.user = {
        id: payload.userId,
        role: payload.role,
        permissions: payload.permissions,
      };
    }
  } catch (err) {
    // Silent fail for optional
  }
  
  next();
}
