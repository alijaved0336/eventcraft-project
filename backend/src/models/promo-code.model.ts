import mongoose, { Schema, Document, Types } from 'mongoose';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export interface IPromoCode {
  eventId: Types.ObjectId;
  code: string;
  discountType: DiscountType;
  value: number; // percentage or fixed amount in cents
  maxUses?: number;
  usedCount: number;
  applicableTo: Types.ObjectId[]; // TicketType IDs
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
  deletedAt?: Date;
}

export interface IPromoCodeDocument extends IPromoCode, Document {
  id: string;
}

const PromoCodeSchema = new Schema<IPromoCodeDocument>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    discountType: {
      type: String,
      enum: Object.values(DiscountType),
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    maxUses: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    applicableTo: [{ type: Schema.Types.ObjectId, ref: 'TicketType' }],
    validFrom: Date,
    validUntil: Date,
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: any, ret: Record<string, any>) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index for eventId and code
PromoCodeSchema.index({ eventId: 1, code: 1 }, { unique: true });

export const PromoCodeModel = mongoose.model<IPromoCodeDocument>('PromoCode', PromoCodeSchema);
