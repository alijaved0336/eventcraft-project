import mongoose, { Schema, type Document, type Types } from 'mongoose';

export enum TicketIssuanceStatus {
  ACTIVE = 'active',
  CHECKED_IN = 'checked_in',
  CANCELLED = 'cancelled',
  TRANSFERRED = 'transferred',
}

export interface ITicketIssuance {
  orderId: Types.ObjectId;
  orderItemId: Types.ObjectId;
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  ticketTypeId: Types.ObjectId;
  qrToken: string; // Internal token (UUID/JWT)
  ticketNumber: string; // Human-readable (e.g. EVT-00042)
  status: TicketIssuanceStatus;
  checkedIn: boolean;
  checkIn: {
    checkedInAt: Date | null;
    checkedInBy: Types.ObjectId | null;
    method: 'qr' | 'manual' | 'virtual' | null;
    deviceInfo: string | null;
    location: string | null;
  };
  assignedTo: {
    userId: Types.ObjectId | null;
    name: string | null;
    email: string | null;
    assignedAt: Date | null;
  } | null;
  attendeeName: string;
  attendeeEmail: string;
  jobTitle?: string;
  transferredTo?: Types.ObjectId;
  transferredAt?: Date;
  joinType?: 'in-person' | 'virtual';
  joinTokenRef?: string;
  tokenExpiresAt?: Date;
  deletedAt?: Date;
}

export interface ITicketIssuanceDocument extends ITicketIssuance, Document {
  id: string;
}

const TicketIssuanceSchema = new Schema<ITicketIssuanceDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderItemId: { type: Schema.Types.ObjectId, required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ticketTypeId: { type: Schema.Types.ObjectId, ref: 'TicketType', required: true },
    qrToken: { type: String, unique: true, sparse: true, index: true, select: false },
    ticketNumber: { type: String, unique: true, required: true },
    status: {
      type: String,
      enum: Object.values(TicketIssuanceStatus),
      default: TicketIssuanceStatus.ACTIVE,
      index: true,
    },
    checkedIn: { type: Boolean, default: false, index: true },
    checkIn: {
      checkedInAt: { type: Date, default: null },
      checkedInBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      method: { type: String, enum: ['qr', 'manual', 'virtual', null], default: null },
      deviceInfo: { type: String, default: null },
      location: { type: String, default: null },
    },
    assignedTo: {
      type: {
        userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        name: { type: String, trim: true, default: null },
        email: { type: String, lowercase: true, trim: true, default: null },
        assignedAt: { type: Date, default: null }
      },
      default: null
    },
    attendeeName: { type: String, required: true },
    attendeeEmail: { type: String, required: true },
    jobTitle: { type: String },
    transferredTo: { type: Schema.Types.ObjectId, ref: 'User' },
    transferredAt: { type: Date },
    joinType: { type: String, enum: ['in-person', 'virtual'], default: 'in-person' },
    joinTokenRef: { type: String },
    tokenExpiresAt: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: ITicketIssuanceDocument, ret: Record<string, unknown>) => {
        ret.id = _doc._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

TicketIssuanceSchema.index({ userId: 1, eventId: 1 });
TicketIssuanceSchema.index({ eventId: 1, status: 1, deletedAt: 1 }); // Recommended for analytics
TicketIssuanceSchema.index({ eventId: 1, status: 1 });
TicketIssuanceSchema.index({ eventId: 1, 'assignedTo.email': 1 });
TicketIssuanceSchema.index({ eventId: 1, 'assignedTo.userId': 1 });
TicketIssuanceSchema.index({ eventId: 1, checkedIn: 1 });
TicketIssuanceSchema.index({ eventId: 1, _id: 1, 'checkIn.checkedInAt': 1 });

export const TicketIssuanceModel = mongoose.model<ITicketIssuanceDocument>(
  'TicketIssuance',
  TicketIssuanceSchema
);
