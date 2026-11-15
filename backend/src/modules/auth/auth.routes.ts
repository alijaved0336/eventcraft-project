import { Router, RequestHandler } from 'express';
import passport from 'passport';
import { authController } from './auth.controller';
import { rateLimit } from '../../middleware/rateLimit';

const router: Router = Router();

/**
 * @api /api/auth/register
 * @desc Standard registration (Initial token issuance)
 */
router.post('/register', authController.register.bind(authController));

/**
 * @api /api/auth/login
 * @desc Standard login (Initial token issuance)
 */
router.post('/login', authController.login.bind(authController));

/**
 * @api /api/auth/refresh
 * @desc Token rotation with breach detection
 * @rate-limit 10 requests per minute per IP
 */
router.post('/refresh', rateLimit(10, 60), authController.refresh.bind(authController));

/**
 * @api /api/auth/logout
 * @desc Invalidates current session and access token
 */
router.post('/logout', authController.logout.bind(authController));

/**
 * @api /api/auth/google
 * @desc Google OAuth Login Redirect
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }) as RequestHandler,
);

/**
 * @api /api/auth/google/callback
 * @desc Google OAuth Callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login?error=oauth_failed',
  }) as RequestHandler,
  authController.googleCallback.bind(authController) as RequestHandler
);

export const authRouter: Router = router;
export default router;
