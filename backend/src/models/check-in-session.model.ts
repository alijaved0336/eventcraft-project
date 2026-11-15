import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ICheckInSession {
  eventId: Types.ObjectId;
  staffId: Types.ObjectId;
  startedAt: Date;
  endedAt: Date | null;
  gate: string;
  deviceInfo?: string;
  stats: {
    scanned: number;
    success: number;
    rejected: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ICheckInSessionDocument extends ICheckInSession, Document {
  id: string;
}

const CheckInSessionSchema = new Schema<ICheckInSessionDocument>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    gate: { type: String, default: 'main' },
    deviceInfo: { type: String },
    stats: {
      scanned: { type: Number, default: 0 },
      success: { type: Number, default: 0 },
      rejected: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: ICheckInSessionDocument, ret: Record<string, any>) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

CheckInSessionSchema.index({ eventId: 1, staffId: 1, startedAt: -1 });

export const CheckInSessionModel = mongoose.model<ICheckInSessionDocument>(
  'CheckInSession',
  CheckInSessionSchema
);
