import { gql } from '@apollo/client';

export const ADMIN_EVENT_ANALYTICS = gql`
  query AdminEventAnalytics($input: AdminAnalyticsInput!) {
    adminEventAnalytics(input: $input) {
      platformSummary {
        totalGrossRevenue
        totalNetRevenue
        totalEvents
        totalPublishedEvents
        totalDraftEvents
        totalCancelledEvents
        totalTicketsSold
        totalAttendeesUnique
        platformCheckInRate
      }
      events {
        nodes {
          eventId
          title
          slug
          status
          startDate
          organizer {
            id
            name
            email
          }
          ticketTypeCount
          totalCapacity
          ticketsSold
          fillRate
          grossRevenue
          refundedAmount
          netRevenue
          uniqueAttendees
          checkedInCount
          checkInRate
          avgTicketPrice
          promoCodeUsageCount
          ticketTypeBreakdown {
            typeId
            name
            price
            capacity
            sold
            revenue
          }
        }
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;
