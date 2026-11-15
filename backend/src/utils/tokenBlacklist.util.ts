import { BlacklistedTokenModel } from '../models/blacklisted-token.model';

/**
 * Access tokens are short-lived (15m), so we only need to blacklist
 * them for the remainder of their lifetime.
 */
export async function blacklistAccessToken(jti: string, expiresInSeconds: number): Promise<void> {
  if (expiresInSeconds <= 0) return;
  
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  
  try {
    await BlacklistedTokenModel.create({
      jti,
      expiresAt,
    });
  } catch (err) {
    // If it's already blacklisted, ignore
    if ((err as any).code !== 11000) {
      throw err;
    }
  }
}

/**
 * Checks if the JTI (unique ID of an access token) is blacklisted.
 */
export async function isBlacklisted(jti: string): Promise<boolean> {
  const result = await BlacklistedTokenModel.findOne({ jti });
  return !!result;
}
