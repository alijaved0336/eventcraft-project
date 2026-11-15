export const livestreamTypeDefs = `#graphql
  """
  Represents the virtual room details for an event session.
  Managed via Daily.co integration.
  """
  type VirtualSession {
    id: ID!
    roomName: String!
    joinUrl: String!
    isLive: Boolean!
    peakAttendees: Int!
    expiresAt: DateTime
    endedAt: DateTime
    recordingUrl: String
    """
    Only returned if the requester is the event organizer.
    Used to launch the Daily.co Room as a moderator.
    """
    hostUrl: String
  }

  extend type Event {
    """
    Virtual/Hybrid session details. Returns null if the event
    is purely in-person or the room hasn't been created yet.
    """
    virtualSession: VirtualSession
  }

  extend type Query {
    """
    Gets a time-limited Meeting Token for an attendee.
    Required for joining private 'virtual' or 'hybrid' rooms.
    """
    getJoinToken(eventId: ID!): String!
  }

  extend type Mutation {
    """
    Provisions a new Daily.co room for an organizer's event.
    Idempotent: returns existing room if already created.
    """
    connectVirtualRoom(eventId: ID!, force: Boolean): VirtualSession!
    
    """
    Toggles the public 'isLive' status of a session.
    Broadcasts 'STREAM_STARTED' or 'STREAM_ENDED' events via WebSocket.
    """
    toggleLivestream(eventId: ID!, isLive: Boolean!): VirtualSession!
    
    """
    Finalizes a virtual session, ejecting all users and invalidating URLs.
    """
    endVirtualSession(eventId: ID!): Boolean!
  }
`;
