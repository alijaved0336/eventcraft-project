import mongoose, { type Document, Schema, type PopulatedDoc, type Types } from 'mongoose';
import type { IUserDocument } from './user.model';
import slugify from 'slugify';
import crypto from 'crypto';

export enum EventType {
  IN_PERSON = 'in-person',
  VIRTUAL = 'virtual',
  HYBRID = 'hybrid',
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export enum EventVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  INVITE_ONLY = 'invite-only',
}

export interface IEventLocation {
  address?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export interface ITicketTier {
  id: string;
  name: string;
  price: number;
  capacity: number;
  description?: string;
}

export interface IVirtualSession {
  provider: 'daily';
  roomName: string;
  joinUrl: string;
  hostUrl: string;
  isLive: boolean;
  currentAttendees: number;
  peakAttendees: number;
  recordingUrl?: string;
  expiresAt?: Date | null;
  endedAt?: Date;
}

export interface IEvent {
  title: string;
  slug: string; // unique, URL-friendly
  description?: string; // rich text
  type: EventType;
  status: EventStatus;
  visibility: EventVisibility;
  organizerId: PopulatedDoc<IUserDocument>; // ref: User
  startDate?: Date;
  endDate?: Date;
  timezone: string; // IANA timezone, default UTC
  location?: IEventLocation;
  virtualLink?: string;
  capacity?: number;
  price?: number;
  currency?: string;
  category?: string;
  bannerImage?: string;  // Cloudinary full-size URL (1200px) — detail view
  bannerUrl?: string;     // Cloudinary thumbnail URL (400px) — listing view
  bannerPublicId?: string; // Cloudinary public_id for deletion on update
  gallery: string[]; // Additional images
  tags: string[];
  isFree: boolean;
  registrationDeadline?: Date;
  ticketTiers: ITicketTier[];
  virtualSession?: IVirtualSession;
  ticketTypes: Types.ObjectId[];
  workflowConfig?: Record<string, unknown>; // module order, template config, etc
  deletedAt?: Date; // for soft delete
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventDocument extends IEvent, Document {
  id: string;
}

interface EventJson extends Record<string, unknown> {
  __v?: number;
  deletedAt?: Date;
}

const LocationSchema = new Schema<IEventLocation>(
  {
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false },
);

const VirtualSessionSchema = new Schema<IVirtualSession>(
  {
    provider: { type: String, enum: ['daily'], default: 'daily' },
    roomName: { type: String, required: true },
    joinUrl: { type: String, required: true },
    hostUrl: { type: String, required: true },
    isLive: { type: Boolean, default: false },
    currentAttendees: { type: Number, default: 0 },
    peakAttendees: { type: Number, default: 0 },
    recordingUrl: { type: String },
    expiresAt: { type: Date },
    endedAt: { type: Date },
  },
  {
    _id: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        return ret;
      },
    },
  },
);

const TicketTierSchema = new Schema<ITicketTier>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        return ret;
      },
    },
  },
);

const EventSchema = new Schema<IEventDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String },
    type: { type: String, enum: Object.values(EventType), default: EventType.IN_PERSON },
    status: { type: String, enum: Object.values(EventStatus), default: EventStatus.DRAFT },
    visibility: {
      type: String,
      enum: Object.values(EventVisibility),
      default: EventVisibility.PRIVATE,
    },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    startDate: { type: Date },
    endDate: { type: Date },
    timezone: { type: String, default: 'UTC' },

    location: LocationSchema,
    virtualLink: { type: String, trim: true },
    capacity: { type: Number, min: 0 },
    price: { type: Number, min: 0 },
    currency: { type: String, default: 'USD', trim: true },
    category: { type: String, trim: true },
    bannerImage: { type: String },
    bannerUrl: { type: String },
    bannerPublicId: { type: String },
    gallery: [{ type: String }],
    tags: [{ type: String, trim: true }],
    isFree: { type: Boolean, default: false },
    registrationDeadline: { type: Date },
    ticketTiers: [TicketTierSchema],
    virtualSession: VirtualSessionSchema,
    ticketTypes: [{ type: Schema.Types.ObjectId, ref: 'TicketType' }],

    workflowConfig: { type: Schema.Types.Mixed, default: {} },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: EventJson) => {
        delete ret.__v;
        // Optionally hide deletedAt in responses
        delete ret.deletedAt;
        return ret;
      },
    },
  },
);

// Indexes for faster queries
EventSchema.index({ organizerId: 1, status: 1 });
EventSchema.index({ status: 1, startDate: 1 });
EventSchema.index({ deletedAt: 1, status: 1, startDate: 1 });
EventSchema.index({ visibility: 1, status: 1 });
EventSchema.index({ tags: 1 });
EventSchema.index({ createdAt: -1 });
EventSchema.index({ organizerId: 1, status: 1, startDate: -1, deletedAt: 1 }); // Recommended for analytics
EventSchema.index({ '$**': 'text' }, { name: 'event_text_search' });

// Auto-generate slug before validation if not provided
EventSchema.pre('validate', function () {
  if (this.title && (!this.slug || this.slug.trim() === '')) {
    // Generate a slug from the title, fallback to UUID if empty
    const baseSlug =
      slugify(this.title, { lower: true, strict: true, trim: true }) || crypto.randomUUID();
    this.slug = `${baseSlug}-${crypto.randomUUID().split('-')[0]}`; // append short hash to prevent collisions
  }
});

export const EventModel = mongoose.model<IEventDocument>('Event', EventSchema);
