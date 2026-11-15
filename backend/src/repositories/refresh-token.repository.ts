import mongoose, { type Document } from 'mongoose';
import crypto from 'crypto';
import { RefreshTokenModel, type IRefreshTokenDocument } from '../models/refresh-token.model';

export class RefreshTokenRepository {
  private static hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async create(data: {
    userId: string;
    token: string;
    family: string;
    expiresAt: Date;
    userAgent?: string | null | undefined;
    ipAddress?: string | null | undefined;
  }): Promise<IRefreshTokenDocument> {
    return RefreshTokenModel.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      tokenHash: this.hash(data.token),
      familyId: data.family,
      expiresAt: data.expiresAt,
      userAgent: data.userAgent || null,
      ipAddress: data.ipAddress || null,
    });
  }

  static async findByToken(token: string): Promise<IRefreshTokenDocument | null> {
    const tokenHash = this.hash(token);
    return RefreshTokenModel.findOne({ tokenHash, isRevoked: false, expiresAt: { $gt: new Date() } });
  }

  static async findAnyByToken(token: string): Promise<IRefreshTokenDocument | null> {
    const tokenHash = this.hash(token);
    return RefreshTokenModel.findOne({ tokenHash });
  }

  static async revokeToken(token: string): Promise<void> {
    const tokenHash = this.hash(token);
    await RefreshTokenModel.updateOne({ tokenHash }, { isRevoked: true, revokedAt: new Date() });
  }

  static async revoke(tokenId: string): Promise<void> {
    await RefreshTokenModel.findByIdAndUpdate(tokenId, { isRevoked: true, revokedAt: new Date() });
  }

  static async revokeAllForUser(userId: string): Promise<void> {
    await RefreshTokenModel.updateMany({ userId }, { isRevoked: true, revokedAt: new Date() });
  }

  static async updateLastUsedByFamily(familyId: string): Promise<void> {
    // This model doesn't have lastUsedAt, but we can update the updatedAt timestamp via a dummy update or skip if unnecessary
    // Using familyId to match the model
    await RefreshTokenModel.updateMany(
      { familyId, isRevoked: false },
      { $set: { updatedAt: new Date() } }
    );
  }

  static async revokeFamily(familyId: string): Promise<void> {
    await RefreshTokenModel.updateMany({ familyId }, { isRevoked: true, revokedAt: new Date() });
  }
}
