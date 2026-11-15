export const analyticsTypeDefs = `#graphql
  type PlatformSummary {
    totalGrossRevenue: Float!
    totalNetRevenue: Float!
    totalEvents: Int!
    totalPublishedEvents: Int!
    totalDraftEvents: Int!
    totalCancelledEvents: Int!
    totalTicketsSold: Int!
    totalAttendeesUnique: Int!
    platformCheckInRate: Float!
  }

  type TicketTypeBreakdown {
    typeId: ID!
    name: String!
    price: Float!
    capacity: Int!
    sold: Int!
    revenue: Float!
  }

  type EventAnalyticsNode {
    eventId: ID!
    title: String!
    slug: String!
    status: String!
    startDate: String
    organizer: OrganizerSummary
    ticketTypeCount: Int!
    totalCapacity: Int!
    ticketsSold: Int!
    fillRate: Float!
    grossRevenue: Float!
    refundedAmount: Float!
    netRevenue: Float!
    uniqueAttendees: Int!
    checkedInCount: Int!
    checkInRate: Float!
    avgTicketPrice: Float!
    promoCodeUsageCount: Int!
    ticketTypeBreakdown: [TicketTypeBreakdown!]!
  }

  type OrganizerSummary {
    id: ID!
    name: String!
    email: String!
  }

  type EventAnalyticsPageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type EventAnalyticsConnection {
    nodes: [EventAnalyticsNode!]!
    totalCount: Int!
    pageInfo: EventAnalyticsPageInfo!
  }

  type AdminEventAnalyticsPayload {
    platformSummary: PlatformSummary!
    events: EventAnalyticsConnection!
  }

  input AdminAnalyticsInput {
    dateRange: AdminDateRangeInput
    statuses: [String!]
    organizerId: ID
    sortBy: String
    sortOrder: SortOrder
    first: Int
    after: String
  }

  input AdminDateRangeInput {
    from: String
    to: String
  }

  enum SortOrder {
    ASC
    DESC
  }

  extend type Query {
    adminEventAnalytics(input: AdminAnalyticsInput!): AdminEventAnalyticsPayload!
  }
`;
