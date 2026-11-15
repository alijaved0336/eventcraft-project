export interface PlatformSummary {
  totalGrossRevenue: number;
  totalNetRevenue: number;
  totalEvents: number;
  totalPublishedEvents: number;
  totalDraftEvents: number;
  totalCancelledEvents: number;
  totalTicketsSold: number;
  totalAttendeesUnique: number;
  platformCheckInRate: number;
}

export interface TicketTypeBreakdown {
  typeId: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  revenue: number;
}

export interface OrganizerSummary {
  id: string;
  name: string;
  email: string;
}

export interface EventAnalyticsNode {
  eventId: string;
  title: string;
  slug: string;
  status: string;
  startDate?: string;
  organizer?: OrganizerSummary;
  ticketTypeCount: number;
  totalCapacity: number;
  ticketsSold: number;
  fillRate: number;
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  uniqueAttendees: number;
  checkedInCount: number;
  checkInRate: number;
  avgTicketPrice: number;
  promoCodeUsageCount: number;
  ticketTypeBreakdown: TicketTypeBreakdown[];
}

export interface EventAnalyticsPageInfo {
  hasNextPage: boolean;
  endCursor?: string;
}

export interface EventAnalyticsConnection {
  nodes: EventAnalyticsNode[];
  totalCount: number;
  pageInfo: EventAnalyticsPageInfo;
}

export interface AdminEventAnalyticsPayload {
  platformSummary: PlatformSummary;
  events: EventAnalyticsConnection;
}

export interface AdminDateRangeInput {
  from?: string; // ISO Date String
  to?: string;   // ISO Date String
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface AdminAnalyticsInput {
  dateRange?: AdminDateRangeInput;
  statuses?: string[];
  organizerId?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  first?: number;
  after?: string;
}
