import mongoose, { Schema, type Document, type Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  EXPIRED = 'expired',
}

export interface IOrderItem {
  ticketTypeId: Types.ObjectId;
  ticketTypeSnapshot: {
    name: string;
    price: number;
    currency: string;
  };
  quantity: number;
  unitPrice: number; // in cents
  lineTotal: number; // in cents
  attendees?: {
    name: string;
    email: string;
    jobTitle?: string;
  }[];
}

export interface IOrder {
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  status: OrderStatus;
  items: IOrderItem[];
  pricing: {
    subtotal: number;
    discount: number;
    total: number;
    currency: string;
  };
  promoCode?: Types.ObjectId;
  promoCodeSnapshot?: {
    code: string;
    discountType: string;
    value: number;
  };
  payment: {
    provider: string;
    paymentIntentId?: string;
    paymentMethodType?: string;
    paidAt?: Date;
    failureReason?: string;
  };
  guests?: Array<{
    issuanceIndex: number;
    name: string;
    email: string;
  }>;
  // Deletion scheduling
  deletionScheduledAt?: Date;
  deletedAt?: Date | null;

  // Cleanup for pending orders
  expiresAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDocument extends IOrder, Document {
  id: string;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    ticketTypeId: { type: Schema.Types.ObjectId, ref: 'TicketType', required: true },
    ticketTypeSnapshot: {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      currency: { type: String, required: true },
    },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
    attendees: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        jobTitle: { type: String },
      },
    ],
  },
  { _id: true }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    items: [OrderItemSchema],
    pricing: {
      subtotal: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
    },
    promoCode: { type: Schema.Types.ObjectId, ref: 'PromoCode', default: null },
    promoCodeSnapshot: {
      code: String,
      discountType: String,
      value: Number,
    },
    payment: {
      provider: { type: String, default: 'stripe' },
      paymentIntentId: { type: String, index: true },
      paymentMethodType: String,
      paidAt: Date,
      failureReason: String,
    },
    guests: [
      {
        issuanceIndex: Number,
        name: String,
        email: String,
      },
    ],
    expiresAt: { type: Date, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: IOrderDocument, ret: Record<string, unknown>) => {
        ret.id = _doc._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// TTL index for automatic cleanup of pending orders
OrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

OrderSchema.index({ userId: 1, eventId: 1, status: 1 });
OrderSchema.index({ stripePaymentIntentId: 1 }); // User mentioned this in Layer 2
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ eventId: 1, status: 1, deletedAt: 1 }); // Recommended for analytics
OrderSchema.index(
  { userId: 1, eventId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { status: 'confirmed' } } // User's 'completed' maps to our 'confirmed'
);


export const OrderModel = mongoose.model<IOrderDocument>('Order', OrderSchema);
