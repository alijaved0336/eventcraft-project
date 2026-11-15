import mongoose, { type Document, Schema, type PopulatedDoc } from 'mongoose';
import type { IUserDocument } from './user.model';

export enum SessionType {
  SESSION = 'session',
  BREAK = 'break',
  KEYNOTE = 'keynote',
  WORKSHOP = 'workshop',
}

export interface ISession {
  eventId: mongoose.Types.ObjectId; // ref: Event
  title: string;
  description?: string;
  day: number;
  startTime: Date;
  endTime: Date;
  location?: string;
  speakerIds: PopulatedDoc<IUserDocument>[]; // ref: User
  track?: string;
  order: number;
  type: SessionType;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionDocument extends ISession, Document {
  id: string;
}

const SessionSchema = new Schema<ISessionDocument>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    day: { type: Number, required: true, min: 1 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: { type: String, trim: true },
    speakerIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    track: { type: String, trim: true },
    order: { type: Number, required: true },
    type: {
      type: String,
      enum: Object.values(SessionType),
      default: SessionType.SESSION,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: { __v?: number; [key: string]: unknown }) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes
SessionSchema.index({ eventId: 1, day: 1, order: 1 });
SessionSchema.index({ speakerIds: 1 });

export const SessionModel = mongoose.model<ISessionDocument>('Session', SessionSchema);
