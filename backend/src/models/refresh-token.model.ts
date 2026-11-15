import mongoose, { type Document, Schema } from 'mongoose';

export interface IRefreshToken {
  tokenHash: string;
  userId: mongoose.Types.ObjectId;
  familyId: string; // UUID v4 identifying the rotation chain
  replacedBy?: string; // hash of the next token in the chain
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
  isRevoked: boolean;
}

export interface IRefreshTokenDocument extends IRefreshToken, Document {}

const RefreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    tokenHash: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: String, required: true, index: true },
    replacedBy: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    userAgent: { type: String, default: null },
    ipAddress: { type: String, default: null },
    isRevoked: { type: Boolean, default: false },
  },
  { 
    timestamps: { createdAt: true, updatedAt: false } 
  },
);

// TTL index for automatic cleanup of expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = mongoose.model<IRefreshTokenDocument>(
  'RefreshToken',
  RefreshTokenSchema,
);
