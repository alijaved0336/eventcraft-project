export const attendanceTypeDefs = `#graphql
  enum TicketStatus {
    active
    checked_in
    cancelled
    transferred
  }

  enum CheckInMethod {
    qr
    manual
    self
  }

  enum CheckInErrorCode {
    TICKET_NOT_FOUND
    ALREADY_CHECKED_IN
    EVENT_MISMATCH
    TICKET_INVALID
    UNAUTHORIZED
  }

  type CheckInData {
    checkedInAt: String
    checkedInBy: ID
    method: CheckInMethod
    location: String
  }

  type TicketTypeSummary {
    id: ID!
    name: String!
  }

  type OrderSummary {
    id: ID!
    referenceNumber: String!
  }

  type UserSummary {
    id: ID!
    name: String!
    email: String!
  }

  type EventSummary {
    id: ID!
    title: String!
    type: String!
    startDate: DateTime
    endDate: DateTime
    location: Location
  }

  type AssignedTo {
    userId: ID
    name: String
    email: String
    assignedAt: DateTime
    isGuest: Boolean!
    isUnassigned: Boolean!
  }

  type AttendeeRecord {
    issuanceId: ID!
    fullName: String
    ticketType: TicketTypeSummary!
    purchaser: UserSummary!
    attendee: AssignedTo!
    checkedIn: Boolean!
    checkedInAt: DateTime
    checkInMethod: CheckInMethod
    status: IssuanceStatus!
  }

  enum IssuanceStatus { ACTIVE CANCELLED REFUNDED TRANSFERRED }

  type AttendanceStats {
    total: Int!
    checkedIn: Int!
    notArrived: Int!
    unassigned: Int!
    byTicketType: [TicketTypeAttendance!]!
    checkInTimeline: [TimelineBucket!]!
  }

  type TicketTypeAttendance {
    ticketTypeId: ID!
    name: String!
    total: Int!
    checkedIn: Int!
  }

  type TimelineBucket {
    bucket: DateTime!
    count: Int!
  }

  type MyTicketIssuance {
    issuanceId: ID!
    event: EventSummary!
    ticketType: TicketTypeSummary!
    assignedTo: AssignedTo
    checkedIn: Boolean!
    checkedInAt: DateTime
  }

  type TicketIssuance {
    id: ID!
    orderId: ID!
    eventId: ID!
    userId: ID!
    ticketTypeId: ID!
    qrToken: String
    qrCode: String
    ticketNumber: String!
    status: TicketStatus!
    checkedIn: Boolean!
    checkIn: CheckInData
    assignedTo: AssignedTo
    referenceNumber: String
    attendeeName: String!
    attendeeEmail: String!
    jobTitle: String
    ticketTypeName: String
    createdAt: String!
    updatedAt: String!
    event: Event
    ticketType: TicketTypeSummary
    order: OrderSummary
  }

  type CheckInSuccess {
    ticketIssuance: TicketIssuance!
    attendee: AttendeeRecord!
  }

  type CheckInError {
    code: CheckInErrorCode!
    message: String!
  }

  union CheckInResult = CheckInSuccess | CheckInError

  input CheckInInput {
    eventId: ID!
    qrToken: String
    email: String
    method: CheckInMethod!
    location: String
  }

  enum AttendeeFilterStatus {
    ALL
    CHECKED_IN
    NOT_ARRIVED
    UNASSIGNED
  }

  input AttendeeFilters {
    status: AttendeeFilterStatus
    checkedIn: Boolean
    unassigned: Boolean
    ticketTypeId: ID
    search: String
  }

  input AssignmentInput {
    name: String
    email: String
    userId: ID
  }

  type AttendeeListResult {
    attendees: [AttendeeRecord!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  extend type Query {
    listAttendeesForEvent(
      eventId: ID!
      filters: AttendeeFilters
      page: Int
      limit: Int
    ): AttendeeListResult!

    getAttendanceStats(eventId: ID!): AttendanceStats!

    myTickets: [MyTicketIssuance!]!
    
    # Existing legacy queries (kept for compatibility if needed, or removed if strictly following new task)
    attendeeList(eventId: ID!, filter: AttendeeFilters, pagination: PaginationInput): AttendeeListResult!
    checkInStats(eventId: ID!): CheckInStats!
    myTicket(issuanceId: ID!): TicketIssuance
  }

  input PaginationInput {
    page: Int
    limit: Int
  }

  type CheckInStats {
    total: Int!
    checkedIn: Int!
    notCheckedIn: Int!
    checkInRate: Float!
    byTicketType: [TicketTypeStats!]!
  }

  type TicketTypeStats {
    ticketTypeName: String!
    total: Int!
    checkedIn: Int!
    rate: Float!
  }

  extend type Mutation {
    assignTicket(issuanceId: ID!, input: AssignmentInput!): TicketIssuance!
    reassignTicket(issuanceId: ID!, input: AssignmentInput!): TicketIssuance!
    revokeAssignment(issuanceId: ID!): TicketIssuance!
    checkInManual(issuanceId: ID!): CheckInResult!
    undoCheckIn(ticketIssuanceId: ID!): TicketIssuance!
    checkInAttendee(input: CheckInInput!): CheckInResult!
  }
`;
