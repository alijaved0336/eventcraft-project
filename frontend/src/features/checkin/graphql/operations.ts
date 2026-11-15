import { gql } from '@apollo/client';

export const CHECK_IN_ATTENDEE = gql`
  mutation CheckInAttendee($input: CheckInInput!) {
    checkInAttendee(input: $input) {
      ... on CheckInSuccess {
        ticketIssuance {
          id
          checkIn {
            checkedInAt
            method
          }
        }
        attendee {
          id
          fullName
          email
          ticketType {
            name
          }
        }
      }
      ... on CheckInError {
        code
        message
      }
    }
  }
`;

export const UNDO_CHECK_IN = gql`
  mutation UndoCheckIn($ticketIssuanceId: ID!) {
    undoCheckIn(ticketIssuanceId: $ticketIssuanceId) {
      id
      checkIn {
        checkedInAt
      }
    }
  }
`;

export const GET_CHECK_IN_STATS = gql`
  query CheckInStats($eventId: ID!) {
    checkInStats(eventId: $eventId) {
      total
      checkedIn
      notCheckedIn
      checkInRate
      byTicketType {
        ticketTypeName
        total
        checkedIn
        rate
      }
    }
  }
`;

export const GET_ATTENDEE_LIST_V2 = gql`
  query GetAttendeeList($eventId: ID!, $filters: AttendeeFilters, $page: Int, $limit: Int) {
    listAttendeesForEvent(eventId: $eventId, filters: $filters, page: $page, limit: $limit) {
      attendees {
        issuanceId
        ticketType {
          name
        }
        purchaser {
          name
          email
        }
        attendee {
          name
          email
          isGuest
          isUnassigned
        }
        checkedIn
        checkedInAt
        status
      }
      total
      totalPages
    }
  }
`;

export const GET_EVENT_STATS_V2 = gql`
  query GetEventStats($eventId: ID!) {
    getAttendanceStats(eventId: $eventId) {
      total
      checkedIn
      notArrived
      unassigned
      byTicketType {
        name
        total
        checkedIn
      }
      checkInTimeline {
        bucket
        count
      }
    }
  }
`;

export const MANUAL_CHECK_IN = gql`
  mutation ManualCheckIn($issuanceId: ID!) {
    checkInManual(issuanceId: $issuanceId) {
      ... on CheckInSuccess {
        attendee {
          fullName
          checkedIn
        }
      }
      ... on CheckInError {
        message
      }
    }
  }
`;

export const ASSIGN_TICKET = gql`
  mutation AssignTicket($issuanceId: ID!, $input: AssignmentInput!) {
    assignTicket(issuanceId: $issuanceId, input: $input) {
      id
      assignedTo {
        name
        email
      }
    }
  }
`;
