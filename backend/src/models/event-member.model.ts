import mongoose, { type Document, Schema } from 'mongoose';
import { UserRole } from '../lib/permissions';

export interface IEventMember {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: UserRole.HOST | UserRole.ADMIN; // Usually HOST, but ADMIN can be explicitly added
  assignedAt: Date;
}

export interface IEventMemberDocument extends IEventMember, Document {
  id: string;
}

const EventMemberSchema = new Schema<IEventMemberDocument>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: [UserRole.HOST, UserRole.ADMIN], default: UserRole.HOST },
    assignedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Prevent duplicate assignments
EventMemberSchema.index({ eventId: 1, userId: 1 }, { unique: true });
EventMemberSchema.index({ userId: 1 }); // for fast "my events" queries

export const EventMemberModel = mongoose.model<IEventMemberDocument>('EventMember', EventMemberSchema);
