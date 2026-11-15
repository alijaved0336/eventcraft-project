import mongoose from 'mongoose';
import { Response } from 'express';
import { RefreshTokenModel } from '../../models/refresh-token.model';
import { UserModel, IUserDocument } from '../../models/user.model';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  hashToken, 
  generateFamilyId 
} from '../../utils/token.util';
import { REFRESH_COOKIE_OPTIONS } from '../../config/cookie.config';
import { AuthErrorCodes } from './auth.errors';
import { logger } from '../../lib/logger';
import { UserRole } from '../../lib/permissions';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Issues a brand new pair of tokens (Initial login)
   */
  async issueTokenPair(user: IUserDocument, userAgent: string | null, ipAddress: string | null, res: Response): Promise<string> {
    const familyId = generateFamilyId();
    const accessToken = generateAccessToken(user.id, user.email, user.role, user.permissions);
    const refreshToken = generateRefreshToken();
    const hashedToken = hashToken(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await RefreshTokenModel.create({
      tokenHash: hashedToken,
      userId: user._id as any,
      familyId,
      expiresAt,
      ...(userAgent && { userAgent }),
      ...(ipAddress && { ipAddress }),
    });

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    return accessToken;
  }

  /**
   * Standard registration
   */
  async register(
    input: {
      email: string;
      password: string;
      name: string;
      role?: UserRole;
      timezone?: string;
    },
    userAgent: string | null,
    ipAddress: string | null,
    res: Response
  ): Promise<{ user: IUserDocument; accessToken: string }> {
    const existing = await UserModel.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw new Error('Email already exists');
    }

    const user = await UserModel.create({
      email: input.email.toLowerCase(),
      name: input.name.trim(),
      passwordHash: input.password, // hashed by pre-save
      role: input.role ?? UserRole.ORGANIZER,
      timezone: input.timezone ?? 'UTC',
      emailVerified: false,
    });

    const accessToken = await this.issueTokenPair(user, userAgent, ipAddress, res);
    
    logger.info('User registered', { userId: user.id, email: user.email });
    return { user, accessToken };
  }

  /**
   * OAuth Login or Register
   */
  async oauthLoginOrRegister(
    input: {
      provider: 'google' | 'github';
      oauthId: string;
      email: string;
      name: string;
      avatar?: string;
      role?: UserRole;
    },
    userAgent: string | null,
    ipAddress: string | null,
    res: Response
  ): Promise<{ user: IUserDocument; accessToken: string; isNew: boolean }> {
    let isNew = false;
    let user = await UserModel.findOne({ oauthProvider: input.provider, oauthId: input.oauthId });

    if (!user) {
      const existing = await UserModel.findOne({ email: input.email.toLowerCase() });

      if (existing) {
        existing.oauthProvider = input.provider;
        existing.oauthId = input.oauthId;
        existing.emailVerified = true;
        if (input.avatar && !existing.avatar) existing.avatar = input.avatar;
        await existing.save();
        user = existing;
      } else {
        user = await UserModel.create({
          email: input.email.toLowerCase(),
          name: input.name,
          avatar: input.avatar ?? null,
          oauthProvider: input.provider,
          oauthId: input.oauthId,
          emailVerified: true,
          role: input.role ?? UserRole.ORGANIZER,
        });
        isNew = true;
      }
    }

    const accessToken = await this.issueTokenPair(user, userAgent, ipAddress, res);
    return { user, accessToken, isNew };
  }

  /**
   * Find or Create OAuth User (For Passport Strategy)
   * This is a pure DB operation, no side effects like token issuance.
   */
  async findOrCreateOAuthUser(input: {
    provider: 'google' | 'github';
    oauthId: string;
    email: string;
    name: string;
    avatar?: string;
    role?: UserRole;
  }): Promise<IUserDocument> {
    let user = await UserModel.findOne({ oauthProvider: input.provider, oauthId: input.oauthId });

    if (!user) {
      const existing = await UserModel.findOne({ email: input.email.toLowerCase() });

      if (existing) {
        existing.oauthProvider = input.provider;
        existing.oauthId = input.oauthId;
        existing.emailVerified = true;
        if (input.avatar && !existing.avatar) existing.avatar = input.avatar;
        await existing.save();
        user = existing;
      } else {
        user = await UserModel.create({
          email: input.email.toLowerCase(),
          name: input.name,
          avatar: input.avatar ?? null,
          oauthProvider: input.provider,
          oauthId: input.oauthId,
          emailVerified: true,
          role: input.role ?? UserRole.ORGANIZER,
        });
      }
    }
    
    return user;
  }

  /**
   * Rotates a refresh token with family-based breach detection
   */
  async rotateRefreshToken(incomingToken: string, userAgent: string | null, ipAddress: string | null, res: Response): Promise<string> {
    const incomingHash = hashToken(incomingToken);
    
    // Start session for atomic rotation
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const storedToken = await RefreshTokenModel.findOne({ tokenHash: incomingHash }).session(session);

      if (!storedToken) {
        throw new Error(AuthErrorCodes.REFRESH_TOKEN_EXPIRED);
      }

      // Breach detection: If token is already revoked, it's a reuse attempt
      if (storedToken.isRevoked) {
        const ROTATION_GRACE_PERIOD_MS = 10000; // 10 seconds
        const revokedAtTime = storedToken.revokedAt?.getTime() || 0;
        const timeSinceRevoked = Date.now() - revokedAtTime;

        if (timeSinceRevoked <= ROTATION_GRACE_PERIOD_MS) {
          logger.warn('Token rotation grace period triggered', { 
            tokenHash: incomingHash, 
            timeSinceRevokedMs: timeSinceRevoked 
          });
          // In grace period: proceed with standard rotation instead of flagging breach
        } else {
          // Beyond grace period: PERMITTED BREACH PROTECTION: Revoke the entire family
          await RefreshTokenModel.updateMany(
            { familyId: storedToken.familyId },
            { isRevoked: true, revokedAt: new Date() }
          ).session(session);

          res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
          throw new Error(AuthErrorCodes.REFRESH_TOKEN_REUSE_DETECTED);
        }
      }

      // Expiry check
      if (storedToken.expiresAt < new Date()) {
        throw new Error(AuthErrorCodes.REFRESH_TOKEN_EXPIRED);
      }

      // User check
      const user = await UserModel.findById(storedToken.userId).session(session);
      if (!user || !user.isActive) {
        throw new Error(AuthErrorCodes.SESSION_EXPIRED);
      }

      // Issue new tokens
      const newRefreshToken = generateRefreshToken();
      const newHash = hashToken(newRefreshToken);
      const accessToken = generateAccessToken(user.id, user.email, user.role, user.permissions);

      // 1. Mark current token as revoked and record its successor
      storedToken.isRevoked = true;
      storedToken.revokedAt = new Date();
      storedToken.replacedBy = newHash;
      await storedToken.save({ session });

      // 2. Create new token in the same family
      await RefreshTokenModel.create([{
        tokenHash: newHash,
        userId: user._id as any,
        familyId: storedToken.familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ...(userAgent && { userAgent }),
        ...(ipAddress && { ipAddress }),
      }], { session });

      await session.commitTransaction();

      // Set cookie and return access token
      res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);
      return accessToken;

    } catch (error) {
      await session.abortTransaction();
      logger.error('Token rotation failed', { error: (error as Error).message, tokenHash: incomingHash });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Revokes a refresh token (Logout)
   */
  async revokeRefreshToken(userId: string, currentToken?: string, allDevices = false): Promise<void> {
    if (allDevices) {
      await RefreshTokenModel.updateMany({ userId }, { isRevoked: true, revokedAt: new Date() });
      return;
    }

    if (currentToken) {
      const tokenHash = hashToken(currentToken);
      await RefreshTokenModel.updateOne({ tokenHash }, { isRevoked: true, revokedAt: new Date() });
    }
  }
}

export const authService = new AuthService();
