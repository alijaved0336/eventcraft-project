import { Event } from '../events/types';

export enum OrderStatus {
  pending = 'pending',
  confirmed = 'confirmed',
  failed = 'failed',
  expired = 'expired',
}

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number; // in cents
  currency: string;
  capacity: number;
  sold: number;
  reserved: number;
  isActive: boolean;
}

export interface Order {
  id: string;
  eventId: string;
  event?: Event;
  status: OrderStatus;
  pricing: {
    subtotal: number;
    discount: number;
    total: number;
    currency: string;
  };
  expiresAt: string; // ISO Date string
}

export interface CreateOrderInput {
  eventId: string;
  items: {
    ticketTypeId: string;
    quantity: number;
    attendees?: {
      name: string;
      email: string;
      jobTitle?: string;
    }[];
  }[];
  promoCode?: string;
}

export interface CreateOrderResponse {
  createOrder: {
    order: Order;
    clientSecret?: string;
  };
}

export interface Ticket {
  id: string;
  orderId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  attendeeName: string;
  attendeeEmail: string;
  jobTitle?: string;
  qrCode?: string; // Base64 or URL
  status: 'valid' | 'used' | 'refunded';
}

export interface OrderWithTickets extends Order {
  tickets: Ticket[];
}

export type TicketStatus = 'active' | 'checked_in' | 'cancelled' | 'transferred';

export type CheckInMethod = 'qr' | 'manual';

export interface CheckInData {
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  method?: CheckInMethod | null;
  location?: string | null;
}

export interface TicketTypeSummary {
  name: string;
}

export interface OrderSummary {
  referenceNumber?: string;
}

export interface TicketIssuance {
  id: string;
  ticketNumber: string;
  status: TicketStatus;
  checkIn?: CheckInData | null;
  attendeeName: string;
  attendeeEmail: string;
  event?: Event | null;
  ticketType?: TicketTypeSummary | null;
  order?: OrderSummary | null;
}

export interface AttendeeProfile {
  id: string;
  fullName: string;
  email: string;
  ticketType: TicketTypeSummary;
  order: OrderSummary;
  checkIn?: CheckInData | null;
  checkedIn: boolean; // From new schema
}

export interface AttendeeV2 {
  issuanceId: string;
  ticketType: { name: string };
  purchaser: { name: string; email: string };
  attendee: {
    name: string;
    email: string;
    isGuest: boolean;
    isUnassigned: boolean;
  };
  checkedIn: boolean;
  checkedInAt?: string;
  status: string;
}

export interface AttendeeListingV2Response {
  listAttendeesForEvent: {
    attendees: AttendeeV2[];
    total: number;
    totalPages: number;
  };
}

export interface CheckInSuccess {
  __typename: 'CheckInSuccess';
  ticketIssuance: TicketIssuance;
  attendee: AttendeeProfile;
}

export enum CheckInErrorCode {
  TICKET_NOT_FOUND = 'TICKET_NOT_FOUND',
  ALREADY_CHECKED_IN = 'ALREADY_CHECKED_IN',
  TICKET_INVALID = 'TICKET_INVALID',
  CHECK_IN_CLOSED = 'CHECK_IN_CLOSED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export interface CheckInError {
  __typename: 'CheckInError';
  code: CheckInErrorCode;
  message: string;
}

export type CheckInResult = CheckInSuccess | CheckInError;

export interface CheckInStatsData {
  total: number;
  checkedIn: number;
  notCheckedIn: number;
  checkInRate: number;
  byTicketType: {
    ticketTypeName: string;
    total: number;
    checkedIn: number;
    rate: number;
  }[];
}

export type AttendeeFilterStatus = 'ALL' | 'CHECKED_IN' | 'NOT_ARRIVED' | 'UNASSIGNED';

export interface AttendeeFilters {
  search?: string;
  status?: AttendeeFilterStatus;
  ticketType?: string;
}

export interface AssignmentInput {
  name: string;
  email: string;
}

export interface AttendanceStatsV2 {
  total: number;
  checkedIn: number;
  notArrived: number;
  unassigned: number;
  byTicketType: {
    name: string;
    total: number;
    checkedIn: number;
  }[];
  checkInTimeline: {
    bucket: string;
    count: number;
  }[];
}

export interface MyTicketV2 {
  issuanceId: string;
  event: {
    id: string;
    title: string;
    type: string;
    startDate: string;
    location: {
      city: string;
      address: string;
    };
  };
  ticketType: {
    name: string;
  };
  assignedTo: {
    name: string;
    email: string;
  };
  checkedIn: boolean;
}
