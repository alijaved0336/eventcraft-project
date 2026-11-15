import { gql } from '@apollo/client';

export const GET_ORDER = gql`
  query GetOrder($orderId: ID!) {
    getOrder(orderId: $orderId) {
      id
      eventId
      status
      pricing {
        subtotal
        discount
        total
        currency
      }
      expiresAt
      tickets {
        id
        ticketTypeName
        attendeeName
        attendeeEmail
        jobTitle
        qrCode
        status
      }
    }
  }
`;

export const GET_MY_ORDERS = gql`
  query GetMyOrders($eventId: ID) {
    getMyOrders(eventId: $eventId) {
      id
      eventId
      status
      pricing {
        total
        currency
      }
      expiresAt
      event {
        id
        title
        startDate
        endDate
        location {
          city
          address
        }
        bannerImage
      }
      tickets {
        id
        ticketTypeName
        attendeeName
        attendeeEmail
        jobTitle
        status
        qrCode
      }
    }
  }
`;

export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      order {
        id
        status
        pricing {
          total
        }
      }
      clientSecret
    }
  }
`;

export const GET_TICKET_TYPES = gql`
  query GetTicketTypes($eventId: ID!) {
    ticketTypes(eventId: $eventId) {
      id
      name
      description
      price
      currency
      capacity
      sold
      reserved
      isActive
    }
  }
`;

export const GET_MY_TICKET_DETAIL = gql`
  query MyTicket($issuanceId: ID!) {
    myTicket(issuanceId: $issuanceId) {
      id
      ticketNumber
      status
      attendeeName
      attendeeEmail
      ticketType {
        name
      }
      checkIn {
        checkedInAt
        method
      }
      event {
        id
        title
        startDate
        endDate
        bannerImage
        location {
          city
          address
        }
      }
    }
  }
`;

export const GET_MY_TICKETS_V2 = gql`
  query GetMyTickets {
    myTickets {
      issuanceId
      event {
        id
        title
        type
        startDate
        location {
          city
          address
        }
      }
      ticketType {
        name
      }
      assignedTo {
        name
        email
      }
      checkedIn
    }
  }
`;
