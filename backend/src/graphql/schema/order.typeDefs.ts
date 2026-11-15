export const orderTypeDefs = `#graphql
  enum OrderStatus {
    pending
    confirmed
    failed
    refunded
    expired
  }

  type OrderPricing {
    subtotal: Float!
    discount: Float!
    total: Float!
    currency: String!
  }

  type OrderItem {
    id: ID!
    ticketTypeId: ID!
    ticketTypeSnapshot: TicketTypeSnapshot!
    quantity: Int!
    unitPrice: Float!
    lineTotal: Float!
  }

  type TicketTypeSnapshot {
    name: String!
    price: Float!
    currency: String!
  }

  type OrderPayment {
    provider: String!
    paymentIntentId: String
    paymentMethodType: String
    paidAt: String
    failureReason: String
  }

  type Order {
    id: ID!
    eventId: ID!
    event: Event!
    userId: ID!
    status: OrderStatus!
    items: [OrderItem!]!
    pricing: OrderPricing!
    payment: OrderPayment
    tickets: [TicketIssuance!]
    expiresAt: String!
    createdAt: String!
    updatedAt: String!
  }

  type CreateOrderPayload {
    order: Order!
    clientSecret: String # Presence depends on total > 0
  }

  input AttendeeInput {
    name: String!
    email: String!
    jobTitle: String
  }

  input OrderItemInput {
    ticketTypeId: ID!
    quantity: Int!
    attendees: [AttendeeInput!]
  }

  input CreateOrderInput {
    eventId: ID!
    items: [OrderItemInput!]!
    promoCode: String
  }

  extend type Query {
    getOrder(orderId: ID!): Order
    getMyOrders(eventId: ID): [Order!]!
  }

  extend type Mutation {
    createOrder(input: CreateOrderInput!): CreateOrderPayload!
    cancelOrder(orderId: ID!): Order!
  }
`;
