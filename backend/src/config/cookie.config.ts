import { config } from './index';

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production' || true, // Must be true for SameSite=None
  sameSite: 'none' as const,
  path: '/api/auth', // scope cookie to auth endpoints
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};
