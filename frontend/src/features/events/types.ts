import { TicketType } from '@/features/tickets/types';

export enum EventType {
  IN_PERSON = 'in-person',
  VIRTUAL = 'virtual',
  HYBRID = 'hybrid',
}

export type EventStatus = 'draft' | 'published' | 'scheduled' | 'ended' | 'cancelled';
export type EventVisibility = 'public' | 'private' | 'invite-only';

export interface EventLocation {
  address?: string | undefined;
  city?: string | undefined;
  country?: string | undefined;
  lat?: number | undefined;
  lng?: number | undefined;
}

export interface TicketTier {
  id?: string | undefined;
  name: string;
  price: number;
  capacity: number;
  description?: string | undefined;
}

export interface Event {
  id: string;
  _id: string; // MongoDB ID from backend
  title: string;
  description?: string;
  type: EventType;
  status: EventStatus;
  visibility: EventVisibility;
  startDate?: string; // ISO Date
  endDate?: string; // ISO Date
  timezone?: string;
  location?: EventLocation;
  bannerImage?: string; // Full-size CDN URL — returned by detail API
  bannerUrl?: string;   // Thumbnail CDN URL — returned by listing API
  tags: string[];
  slug: string;
  isOwner?: boolean;
  virtualSession?: {
    id: string;
    roomName: string;
    joinUrl: string;
    hostUrl?: string;
    isLive: boolean;
  };
  ticketTypes?: TicketType[];
  organizerId?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface CreateEventRequest {
  title: string;
  description?: string | undefined;
  type: string;
  status: string;
  visibility: string;
  startDate?: string | undefined;
  endDate?: string | undefined;
  timezone?: string | undefined;
  location?: EventLocation | undefined;
  bannerImage?: string | undefined;
  tags?: string[] | undefined;
  isFree?: boolean | undefined;
  registrationDeadline?: string | undefined;
  ticketTiers?: TicketTier[] | undefined;
}

export type UpdateEventRequest = Partial<CreateEventRequest>;

export enum SessionType {
  SESSION = 'session',
  BREAK = 'break',
  KEYNOTE = 'keynote',
  WORKSHOP = 'workshop',
}

export interface Session {
  id: string;
  _id: string;
  eventId: string;
  title: string;
  description?: string;
  day: number;
  startTime: string; // ISO Date String
  endTime: string; // ISO Date String
  location?: string;
  speakerIds: string[]; // Or populated User objects
  track?: string;
  order: number;
  type: SessionType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionInput {
  eventId: string;
  title: string;
  description?: string;
  day: number;
  startTime: string;
  endTime: string;
  location?: string;
  speakerIds?: string[];
  track?: string;
  order: number;
  type?: SessionType;
}

export type UpdateSessionInput = Partial<CreateSessionInput>;
