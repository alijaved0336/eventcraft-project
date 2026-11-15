import { Router, type RequestHandler } from 'express';
import passport from 'passport';
import { AuthService } from '../../services/auth.service';
import { logger } from '../../lib/logger';
import { UnauthorizedError } from '../../errors';
import { RegisterInputSchema, LoginInputSchema } from '../../validators/auth.validator';
import type { IUserDocument } from '../../models/user.model';

export const authRouter: any = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, role]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               name: { type: string }
 *               role: { type: string, enum: [admin, organizer, host] }
 *               timezone: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email already exists
 */
authRouter.post('/register', (async (req: any, res: any, next: any) => {
  try {
    const validated = RegisterInputSchema.parse(req.body);
    const { user, tokens } = await AuthService.register(validated, req.headers['user-agent']);

    res.cookie('refreshToken', tokens.refreshToken, AuthService.getCookieOptions());
    (res as any).status(201).json({ user, accessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
authRouter.post('/login', (async (req: any, res: any, next: any) => {
  try {
    const validated = LoginInputSchema.parse(req.body);
    const { user, tokens } = await AuthService.login(validated, req.headers['user-agent']);

    res.cookie('refreshToken', tokens.refreshToken, AuthService.getCookieOptions());
    (res as any).json({ user, accessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Unauthorized
 */
authRouter.post('/refresh', (async (req: any, res: any) => {
  try {
    // 1. Extract tokens (handle potential duplicates from different paths)
    const rawCookies = (req.headers.cookie as string) || '';
    const refreshTokenCookies = rawCookies
      .split(';')
      .map((c: string) => c.trim())
      .filter((c: string) => c.startsWith('refreshToken='))
      .map((c: string) => c.split('=')[1])
      .filter((c: string | undefined): c is string => !!c);

    if (refreshTokenCookies.length === 0) {
      return (res as any).status(401).json({ message: 'No refresh token provided' });
    }

    // Identify the best token to use (prefer valid ones to avoid accidental revocation)
    const validToken = await AuthService.findValidToken(refreshTokenCookies);
    const tokenToUse = validToken || refreshTokenCookies[0] as string;

    logger.info('Refresh attempt', { 
      tokenPrefix: tokenToUse.substring(0, 10),
      count: refreshTokenCookies.length,
      isFallback: !validToken 
    });

    // 2. Refresh logic
    const tokens = await AuthService.refreshTokens(tokenToUse, req.headers['user-agent']);

    // 3. Clear old path if it exists to help migrate user
    res.clearCookie('refreshToken', AuthService.getOldCookieOptions());
    
    // 4. Set new token at root path
    res.cookie('refreshToken', tokens.refreshToken, AuthService.getCookieOptions());
    return (res as any).json({ accessToken: tokens.accessToken });
  } catch (err) {
    // Clear cookies on any refresh failure
    res.clearCookie('refreshToken', AuthService.getCookieOptions());
    res.clearCookie('refreshToken', AuthService.getOldCookieOptions());
    
    return (res as any).status(401).json({ 
      message: 'Refresh token invalid or expired' 
    });
  }
}) as RequestHandler);

/**
 * @openapi
 * /api/auth/google:
 *   get:
 *     summary: Login with Google
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Google login
 */
authRouter.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }) as RequestHandler,
);

/**
 * @openapi
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to frontend with tokens
 */
authRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login?error=oauth_failed',
  }) as RequestHandler,
  async (req: any, res: any, next: any) => {
    try {
      const oauthUser = req.user as unknown as IUserDocument;
      const tokens = await AuthService.issueTokens(oauthUser, req.headers['user-agent']);
      res.cookie('refreshToken', tokens.refreshToken, AuthService.getCookieOptions());
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback#token=${tokens.accessToken}`);
    } catch (err) {
      next(err);
    }
  },
);
