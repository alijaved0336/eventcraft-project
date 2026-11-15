import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '../lib/permissions';

export interface JwtPayload {
  id: string; // Alias for userId, used by permission checker
  userId: string;
  email: string;
  role: UserRole;
  permissions: { action: string; level: string }[];
  jti: string; // Unique ID for each access token (for blacklisting)
  iat?: number;
  exp?: number;
}

export function generateAccessToken(
  userId: string,
  email: string,
  role: UserRole,
  permissions: { action: string; level: string }[]
): string {
  const jti = crypto.randomUUID();
  const payload: JwtPayload = {
    id: userId,
    userId,
    email,
    role,
    permissions,
    jti,
  };

  const signOptions: SignOptions = {
    expiresIn: config.jwtAccessExpiresIn as any,
  };

  return jwt.sign(payload, config.jwtAccessSecret, signOptions);
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtAccessSecret) as JwtPayload;
}

export function generateFamilyId(): string {
  return crypto.randomUUID();
}
