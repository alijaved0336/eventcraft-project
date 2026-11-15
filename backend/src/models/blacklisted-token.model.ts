import mongoose, { Schema, type Document } from 'mongoose';

export interface IBlacklistedToken extends Document {
  jti: string;
  expiresAt: Date;
}

const BlacklistedTokenSchema = new Schema<IBlacklistedToken>(
  {
    jti: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL Index: Automatically delete the document when expiresAt is reached
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const BlacklistedTokenModel = mongoose.model<IBlacklistedToken>(
  'BlacklistedToken',
  BlacklistedTokenSchema,
);
