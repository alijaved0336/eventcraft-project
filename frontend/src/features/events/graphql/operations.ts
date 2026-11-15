import { gql } from '@apollo/client';

export const DISCOVER_EVENTS = gql`
  query DiscoverEvents(
    $query: String
    $lat: Float
    $lng: Float
    $radiusInMeters: Float
    $date: String
    $limit: Int
    $offset: Int
  ) {
    discoverEvents(
      query: $query
      lat: $lat
      lng: $lng
      radiusInMeters: $radiusInMeters
      date: $date
      limit: $limit
      offset: $offset
    ) {
      totalCount
      hasMore
      events {
        id
        title
        startDate
        endDate
        location {
          city
          country
        }
        tags
        price
        currency
        bannerUrl
        slug
      }
    }
  }
`;

export const AUTOCOMPLETE_EVENTS = gql`
  query AutocompleteEvents($query: String!, $limit: Int) {
    autocompleteEvents(query: $query, limit: $limit) {
      id
      title
      tags
    }
  }
`;
