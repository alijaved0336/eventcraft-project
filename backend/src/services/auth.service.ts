import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { UserRole } from '../lib/permissions';
import { type IUserDocument } from '../models/user.model';
import { type IRefreshTokenDocument } from '../models/refresh-token.model';
import { ConflictError, TokenExpiredError, UnauthorizedError } from '../errors';
import { logger } from '../lib/logger';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  userAgent?: string | undefined;
  tokenFamily?: string | undefined;
  iat?: number;
  exp?: number;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

export class AuthService {
  // ── Token helpers ────────────────────────────────────────

  static generateAccessToken(user: IUserDocument): string {
    const options: jwt.SignOptions = {};
    Object.assign(options, { expiresIn: config.jwtAccessExpiresIn });
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role, jti: crypto.randomUUID(), permissions: user.permissions },
      config.jwtAccessSecret,
      options,
    );
  }

  static generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  static verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwtAccessSecret) as JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError();
      }
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  static async rotateTokens(
    oldRefreshToken: string,
    deviceInfo?: { userAgent: string | null; ip: string | null; lastUsedAt: Date },
  ): Promise<AuthTokens & { payload: JwtPayload }> {
    const tokens = await this.refreshTokens(oldRefreshToken, deviceInfo);
    const payload = jwt.decode(tokens.accessToken) as JwtPayload;
    return { ...tokens, payload };
  }

  static async issueTokens(
    user: IUserDocument,
    deviceInfo?: { userAgent: string | null; ip: string | null; lastUsedAt: Date },
    family?: string, // omit on first login, pass on rotation
  ): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    const tokenFamily = family ?? crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      family: tokenFamily,
      expiresAt,
      userAgent: deviceInfo?.userAgent,
      ipAddress: deviceInfo?.ip,
    });

    return { accessToken, refreshToken };
  }

  // ── Register ─────────────────────────────────────────────

  static async register(
    input: {
      email: string;
      password: string;
      name: string;
      role?: UserRole;
      timezone?: string;
    },
    userAgent?: string,
  ): Promise<{ user: IUserDocument; tokens: AuthTokens }> {
    if (await UserRepository.existsByEmail(input.email)) {
      throw new ConflictError('An account with this email already exists');
    }

    const user = await UserRepository.create({
      email: input.email,
      name: input.name.trim(),
      passwordHash: input.password, // hashed by pre-save hook in model
      role: input.role ?? UserRole.ORGANIZER,
      timezone: input.timezone ?? 'UTC',
      emailVerified: false,
    });

    const tokens = await this.issueTokens(user, userAgent ? { userAgent, ip: null, lastUsedAt: new Date() } : undefined);

    logger.info('User registered', { userId: user.id, email: user.email });

    return { user, tokens };
  }

  // ── Login ────────────────────────────────────────────────

  static async login(
    input: { email: string; password: string },
    userAgent?: string,
  ): Promise<{ user: IUserDocument; tokens: AuthTokens }> {
    const user = await UserRepository.findByEmailWithPassword(input.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError(`This account uses ${user.oauthProvider ?? 'social'} login`);
    }

    const valid = await user.comparePassword(input.password);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await UserRepository.updateLastLogin(user.id);
    const tokens = await this.issueTokens(user, userAgent ? { userAgent, ip: null, lastUsedAt: new Date() } : undefined);

    logger.info('User logged in', { userId: user.id });

    return { user, tokens };
  }

  // ── OAuth ────────────────────────────────────────────────

  static async oauthLoginOrRegister(
    input: {
      provider: 'google' | 'github';
      oauthId: string;
      email: string;
      name: string;
      avatar?: string;
      role?: UserRole;
    },
    userAgent?: string,
  ): Promise<{ user: IUserDocument; tokens: AuthTokens; isNew: boolean }> {
    let isNew = false;

    // 1. Look up existing OAuth account
    let user = await UserRepository.findByOAuth(input.provider, input.oauthId);

    if (!user) {
      const existing = await UserRepository.findByEmail(input.email);

      if (existing) {
        // 2. Link OAuth to existing email account
        user = (await UserRepository.updateById(existing.id, {
          oauthProvider: input.provider,
          oauthId: input.oauthId,
          emailVerified: true,
          ...((existing.avatar ?? input.avatar) && { avatar: existing.avatar ?? input.avatar }),
        })) as IUserDocument;
      } else {
        // 3. Brand new user via OAuth
        user = await UserRepository.create({
          email: input.email.toLowerCase(),
          name: input.name,
          ...(input.avatar && { avatar: input.avatar }),
          oauthProvider: input.provider,
          oauthId: input.oauthId,
          emailVerified: true,
          role: input.role ?? UserRole.ORGANIZER,
        });
        isNew = true;
      }
    }

    await UserRepository.updateLastLogin(user.id);
    const tokens = await this.issueTokens(user, userAgent ? { userAgent, ip: null, lastUsedAt: new Date() } : undefined);

    return { user, tokens, isNew };
  }

  // ── Refresh token rotation ───────────────────────────────

  static async refreshTokens(
    oldToken: string, 
    deviceInfo?: {
      userAgent: string | null;
      ip: string | null;
      lastUsedAt: Date;
    },
  ): Promise<AuthTokens> {
    const stored = await RefreshTokenRepository.findByToken(oldToken);

    if (!stored) {
      // Token already used or doesn't exist — possible theft
      // Revoke entire family as a security measure
      const hacked = await RefreshTokenRepository.findAnyByToken(oldToken);
      if (hacked) {
        await RefreshTokenRepository.revokeFamily(hacked.familyId);
      }
      throw new UnauthorizedError('Refresh token invalid — please log in again');
    }

    // Revoke used token immediately
    await RefreshTokenRepository.revokeToken(oldToken);

    const user = await UserRepository.findById(stored.userId.toString());
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Issue new pair — same family for rotation chain
    const tokens = await this.issueTokens(user, deviceInfo, stored.familyId);
    
    // Update lastUsedAt for the current family session
    await RefreshTokenRepository.updateLastUsedByFamily(stored.familyId);

    return tokens;
  }

  static async findValidToken(tokens: string[]): Promise<string | undefined> {
    for (const token of tokens) {
      const stored = await RefreshTokenRepository.findByToken(token);
      if (stored) return token;
    }
    return undefined;
  }

  static async findValidTokenDoc(tokens: string[]): Promise<IRefreshTokenDocument | undefined> {
    for (const token of tokens) {
      const stored = await RefreshTokenRepository.findByToken(token);
      if (stored) return stored;
    }
    return undefined;
  }

  // ── Logout ───────────────────────────────────────────────

  static async logout(refreshToken: string): Promise<void> {
    await RefreshTokenRepository.revokeToken(refreshToken);
  }

  static async logoutAll(userId: string): Promise<void> {
    await RefreshTokenRepository.revokeAllForUser(userId);
  }

  // ── Cookie helper ────────────────────────────────────────

  static getCookieOptions() {
    return COOKIE_OPTIONS;
  }

  static getOldCookieOptions() {
    return {
      ...COOKIE_OPTIONS,
      path: '/api/auth/refresh',
    };
  }
}
