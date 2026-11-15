import { type Request, type Response, type NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { TokenExpiredError, UnauthorizedError } from '../errors';
import type { JwtPayload } from '../services/auth.service';

import type { IUserDocument } from '../models/user.model';

// Extend Express Request to carry decoded user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // Extend the existing User interface used by Passport/Express
    interface User extends JwtPayload, Partial<IUserDocument> {
      id: string;
    }
  }
}

export async function tryRefresh(req: Request, res: Response): Promise<boolean> {
  try {
    const rawCookies = req.headers.cookie || '';
    const refreshTokenCookies = rawCookies
      .split(';')
      .map((c: string) => c.trim())
      .filter((c: string) => c.startsWith('refreshToken='))
      .map((c: string) => c.split('=')[1])
      .filter((c: string | undefined): c is string => !!c);

    if (refreshTokenCookies.length === 0) return false;

    // Identify the best token to use (prefer valid ones to avoid accidental revocation)
    const validToken = await AuthService.findValidToken(refreshTokenCookies);
    const tokenToUse = validToken || (refreshTokenCookies[0] as string);

    const userAgent = typeof req.headers['user-agent'] === 'string'
      ? req.headers['user-agent']
      : undefined;

    const rotated = await AuthService.rotateTokens(tokenToUse, { userAgent: userAgent || null, ip: null, lastUsedAt: new Date() });

    // Clear old path if it exists
    res.clearCookie('refreshToken', AuthService.getOldCookieOptions());
    // Set new token at root path
    res.cookie('refreshToken', rotated.refreshToken, AuthService.getCookieOptions());
    res.setHeader('x-new-access-token', rotated.accessToken);

    req.user = { ...rotated.payload, id: rotated.payload.userId };
    return true;
  } catch {
    // Clear cookies on any refresh failure to prevent loops with invalid/stale tokens
    res.clearCookie('refreshToken', AuthService.getCookieOptions());
    res.clearCookie('refreshToken', AuthService.getOldCookieOptions());
    return false;
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.slice(7);
    try {
      const decoded = AuthService.verifyAccessToken(token);
      req.user = { ...decoded, id: decoded.userId };
      return next();
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        const refreshed = await tryRefresh(req, res);
        if (refreshed) return next();
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

// Used on routes where auth is optional
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decoded = AuthService.verifyAccessToken(token);
        req.user = { ...decoded, id: decoded.userId };
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          await tryRefresh(req, res);
        }
      }
    }
  } catch {
    // silently ignore — req.user stays undefined
  }
  next();
}
