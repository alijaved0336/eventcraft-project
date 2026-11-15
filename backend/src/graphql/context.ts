import type { Request, Response } from 'express';
import { verifyAccessToken, type JwtPayload } from '../utils/token.util';
import { isBlacklisted } from '../utils/tokenBlacklist.util';
import { RefreshTokenModel } from '../models/refresh-token.model';
import { hashToken } from '../utils/token.util';
import { logger } from '../lib/logger';
import { createUserLoader, createTicketTypeLoader } from './loaders';

export interface ApolloContext {
  user: JwtPayload | null;
  req: Request;
  res: Response;
  tokenFamily: string | undefined;
  ip: string;
  loaders: {
    user: ReturnType<typeof createUserLoader>;
    ticketType: ReturnType<typeof createTicketTypeLoader>;
  };
}

/**
 * Builds the Apollo Server context by verifying the authentication state.
 * Refrains from silent refresh — clients must use the /auth/refresh REST endpoint.
 */
export async function buildApolloContext({ req, res }: { req: Request; res: Response }): Promise<ApolloContext> {
  const rawIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;
  
  let user: JwtPayload | null = null;
  let tokenFamily: string | undefined = undefined;

  try {
    const authHeader = req.headers.authorization;

    // 1. Authenticate Access Token
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const payload = verifyAccessToken(token);
          
          // Bridge userId -> id for consistency in internal logic
          if (payload.userId && !payload.id) {
            payload.id = payload.userId;
          }

          // Check blacklist (logout check)
          if (payload.jti) {
            const blacklisted = await isBlacklisted(payload.jti);
            if (!blacklisted) {
              user = payload;
            } else {
              logger.warn('Token is blacklisted', { jti: payload.jti, userId: payload.userId });
            }
          }
        } catch (err: any) {
          // Token invalid or expired — no silent refresh here
          logger.warn('JWT verification failed in Apollo Context', { 
            message: err.message,
            stack: err.stack?.split('\n')[0] 
          });
        }
      }
    }

    // 2. Extract Token Family (identifies the current session chain)
    const reqWithCookies = req as Request & { cookies?: Record<string, string> };
    const refreshToken = reqWithCookies.cookies?.refreshToken;
    
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      const stored = await RefreshTokenModel.findOne({ tokenHash, isRevoked: false });
      if (stored) {
        tokenFamily = stored.familyId;
      }
    }
  } catch (error) {
    logger.error('Critical error in buildApolloContext', { 
      error: error instanceof Error ? error.message : String(error),
      path: req.path 
    });
    // Ensure we don't return a half-baked session state
    user = null;
    tokenFamily = undefined;
  }

  return {
    user,
    req,
    res,
    tokenFamily,
    ip: ip || 'unknown',
    loaders: {
      user: createUserLoader(),
      ticketType: createTicketTypeLoader(),
    },
  };
}
