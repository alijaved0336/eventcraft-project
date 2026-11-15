import { gql } from '@apollo/client';

export const GET_JOIN_TOKEN = gql`
  query GetJoinToken($eventId: ID!) {
    getJoinToken(eventId: $eventId)
  }
`;

export const CONNECT_VIRTUAL_ROOM = gql`
  mutation ConnectVirtualRoom($eventId: ID!, $force: Boolean) {
    connectVirtualRoom(eventId: $eventId, force: $force) {
      id
      roomName
      joinUrl
      hostUrl
      isLive
    }
  }
`;

export const TOGGLE_LIVESTREAM = gql`
  mutation ToggleLivestream($eventId: ID!, $isLive: Boolean!) {
    toggleLivestream(eventId: $eventId, isLive: $isLive) {
      id
      isLive
    }
  }
`;

export const END_VIRTUAL_SESSION = gql`
  mutation EndVirtualSession($eventId: ID!) {
    endVirtualSession(eventId: $eventId)
  }
`;

export const GET_EVENT_LIVESTREAM_DETAILS = gql`
  query GetEventDetails($id: ID!) {
    event(id: $id) {
      id
      title
      virtualSession {
        id
        roomName
        joinUrl
        hostUrl
        isLive
        peakAttendees
      }
    }
  }
`;
