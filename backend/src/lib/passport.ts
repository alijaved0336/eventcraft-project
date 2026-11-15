import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  type Profile,
  type VerifyCallback,
} from 'passport-google-oauth20';
import { config } from '../config';
import { authService } from '../modules/auth/auth.service';
import { logger } from '../lib/logger';

export function initPassport(): void {
  // ── Google ─────────────────────────────────────────────────
  passport.use(
    new (GoogleStrategy as any)(
      {
        clientID: config.googleClientId,
        clientSecret: config.googleClientSecret,
        callbackURL: `${config.oauthCallbackBase}/auth/google/callback`,
      },
      (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
        void (async () => {
          try {
            const email = profile.emails?.[0]?.value;
            const avatar = profile.photos?.[0]?.value;

            if (!email) {
              done(new Error('No email from Google profile'));
              return;
            }

            const user = await authService.findOrCreateOAuthUser({
              provider: 'google',
              oauthId: profile.id,
              email,
              name: profile.displayName,
              ...(avatar ? { avatar } : {}),
            });

            done(null, user);
          } catch (err) {
            logger.error('Google OAuth error', { error: err });
            done(err as Error);
          }
        })();
      },
    ),
  );
}
