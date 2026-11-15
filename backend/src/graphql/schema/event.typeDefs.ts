export const eventTypeDefs = `#graphql
  enum CacheControlScope {
    PUBLIC
    PRIVATE
  }

  directive @cacheControl(
    maxAge: Int
    scope: CacheControlScope
    inheritMaxAge: Boolean
  ) on FIELD_DEFINITION | OBJECT | INTERFACE | UNION

  type Location {
    address: String
    city:    String
    country: String
    lat:     Float
    lng:     Float
  }

  type TicketTier {
    id:          ID!
    name:        String!
    price:       Float!
    capacity:    Int!
    description: String
  }

  type TicketType {
    id:          ID!
    name:        String!
    description: String
    price:       Float!
    currency:    String!
    capacity:    Int!
    sold:        Int!
    reserved:    Int!
    isActive:    Boolean!
    createdAt:   DateTime!
    updatedAt:   DateTime!
  }

  type Event {
    id:             ID!
    title:          String!
    description:    String
    type:           EventType!
    status:         EventStatus!
    visibility:     EventVisibility!
    organizerId:    User!
    startDate:      DateTime
    endDate:        DateTime
    timezone:       String!
    location:       Location
    virtualLink:    String
    capacity:       Int
    price:          Float
    currency:       String
    category:       String
    bannerImage:    String
    bannerUrl:      String
    gallery:        [String!]!
    tags:           [String!]!
    isFree:         Boolean!
    registrationDeadline: DateTime
    ticketTiers:    [TicketTier!]!
    isOwner:        Boolean!
    slug:           String!
    createdAt:      DateTime!
    updatedAt:      DateTime!
  }

  enum EventType {
    in_person
    virtual
    hybrid
  }

  enum EventStatus {
    draft
    published
    scheduled
    ended
    cancelled
  }

  enum EventVisibility {
    public
    private
    invite_only
  }

  input LocationInput {
    address: String
    city:    String
    country: String
    lat:     Float
    lng:     Float
  }

  input TicketTierInput {
    id:          ID
    name:        String!
    price:       Float!
    capacity:    Int!
    description: String
  }

  input CreateEventInput {
    title:       String!
    description: String
    type:        EventType
    status:      EventStatus
    visibility:  EventVisibility
    startDate:   DateTime
    endDate:     DateTime
    timezone:    String
    location:    LocationInput
    virtualLink: String
    capacity:    Int
    price:       Float
    currency:    String
    category:    String
    bannerImage: String
    gallery:     [String!]
    tags:        [String!]
    isFree:      Boolean
    registrationDeadline: DateTime
    ticketTiers: [TicketTierInput!]
  }

  input UpdateEventInput {
    title:       String
    description: String
    type:        EventType
    status:      EventStatus
    visibility:  EventVisibility
    startDate:   DateTime
    endDate:     DateTime
    timezone:    String
    location:    LocationInput
    virtualLink: String
    capacity:    Int
    price:       Float
    currency:    String
    category:    String
    bannerImage: String
    gallery:     [String!]
    tags:        [String!]
    isFree:      Boolean
    registrationDeadline: DateTime
    ticketTiers: [TicketTierInput!]
  }

  type DiscoverResponse {
    events: [Event!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  extend type Query {
    getEvents: [Event!]! @cacheControl(maxAge: 60)
    featuredEvents: [Event!]! @cacheControl(maxAge: 300)
    discoverEvents(
      query: String
      lat: Float
      lng: Float
      radiusInMeters: Float
      date: String
      limit: Int
      offset: Int
    ): DiscoverResponse! @cacheControl(maxAge: 60)
    autocompleteEvents(query: String!, limit: Int): [Event!]! @cacheControl(maxAge: 300)
    getEvent(idOrSlug: String!): Event @cacheControl(maxAge: 300)
    event(id: ID!): Event @cacheControl(maxAge: 300)
    ticketTypes(eventId: ID!): [TicketType!]! @cacheControl(maxAge: 300)
  }

  extend type Mutation {
    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    deleteEvent(id: ID!): Boolean!
    publishEvent(id: ID!): Event!
  }
`;
