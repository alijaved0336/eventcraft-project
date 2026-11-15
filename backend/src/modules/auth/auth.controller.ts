import { Request, Response } from 'express';
import { authService } from './auth.service';
import { AuthErrorCodes } from './auth.errors';
import { UserModel, type IUserDocument } from '../../models/user.model';
import { logger } from '../../lib/logger';
import { REFRESH_COOKIE_OPTIONS } from '../../config/cookie.config';
import { blacklistAccessToken } from '../../utils/tokenBlacklist.util';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

interface DecodedToken {
  jti: string;
  exp: number;
}

export class AuthController {
  async refresh(req: Request, res: Response): Promise<void> {
    const incomingToken = (req as any).cookies?.refreshToken as string | undefined;
    
    if (!incomingToken) {
      res.status(401).json({ code: AuthErrorCodes.MISSING_REFRESH_TOKEN });
      return;
    }

    try {
      const userAgent = req.headers['user-agent'] || null;
      const ipAddress = req.ip || null;

      const accessToken = await authService.rotateRefreshToken(
        incomingToken, 
        userAgent, 
        ipAddress, 
        res
      );

      res.status(200).json({ accessToken });
    } catch (error: any) {
      logger.error('Token refresh failed', { error: error.message, stack: error.stack });
      const errorCode = error.message;

      if (errorCode === AuthErrorCodes.REFRESH_TOKEN_REUSE_DETECTED) {
        res.status(401).json({ code: AuthErrorCodes.TOKEN_FAMILY_COMPROMISED });
      } else if (errorCode === AuthErrorCodes.REFRESH_TOKEN_EXPIRED) {
        res.status(401).json({ code: AuthErrorCodes.SESSION_EXPIRED });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }

  /**
   * Login handler integration
   */
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      const user = await UserModel.findOne({ email }).select('+passwordHash');
      if (!user || !(await user.comparePassword(password))) {
         res.status(401).json({ message: 'Invalid credentials' });
         return;
      }

      const userAgent = req.headers['user-agent'] || null;
      const ipAddress = req.ip || null;

      const accessToken = await authService.issueTokenPair(user, userAgent, ipAddress, res);

      res.status(200).json({ accessToken });
    } catch (error) {
      logger.error('Login error', { error });
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Registration handler
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role, timezone } = req.body;
      const userAgent = req.headers['user-agent'] || null;
      const ipAddress = req.ip || null;

      const { user, accessToken } = await authService.register(
        { email, password, name, role, timezone },
        userAgent,
        ipAddress,
        res
      );

      res.status(201).json({ user, accessToken });
    } catch (error: any) {
      if (error.message === 'Email already exists') {
        res.status(409).json({ message: error.message });
      } else {
        logger.error('Registration error', { error });
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }

  /**
   * Google OAuth Callback
   */
  async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      const oauthUser = req.user as IUserDocument;
      const userAgent = req.headers['user-agent'] || null;
      const ipAddress = req.ip || null;

      const { accessToken } = await authService.oauthLoginOrRegister(
        {
          provider: 'google',
          oauthId: oauthUser.oauthId!,
          email: oauthUser.email,
          name: oauthUser.name,
          ...(oauthUser.avatar ? { avatar: oauthUser.avatar as string } : {}),
        },
        userAgent,
        ipAddress,
        res
      );

      res.redirect(`${config.frontendUrl}/auth/callback#token=${accessToken}`);
    } catch (error) {
      logger.error('Google callback error', { error });
      res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
  }

  /**
   * Logout handler with JTI blacklisting
   */
  async logout(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;
    const refreshToken = (req as any).cookies?.refreshToken as string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.decode(token) as DecodedToken | null;
          if (decoded?.jti && decoded?.exp) {
            const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
            await blacklistAccessToken(decoded.jti, ttl);
          }
        } catch (err) {
          logger.warn('Failed to decode JWT for blacklisting', { err });
        }
      }
    }

    if (refreshToken) {
      await authService.revokeRefreshToken('', refreshToken);
    }

    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ success: true });
  }
}

export const authController = new AuthController();
