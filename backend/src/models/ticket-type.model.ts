import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITicketType {
  eventId: Types.ObjectId;
  name: string;
  description?: string;
  price: number; // in cents
  currency: string;
  capacity: number;
  sold: number;
  reserved: number;
  isActive: boolean;
  deletedAt?: Date;
}

export interface ITicketTypeDocument extends ITicketType, Document {
  id: string;
}

const TicketTypeSchema = new Schema<ITicketTypeDocument>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', trim: true },
    capacity: { type: Number, required: true, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date },
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

// Compound index for event and name
TicketTypeSchema.index({ eventId: 1, name: 1 }, { unique: true });

export const TicketTypeModel = mongoose.model<ITicketTypeDocument>('TicketType', TicketTypeSchema);
