export const settingsTypeDefs = `#graphql
  type NotificationEmailPrefs {
    ticketConfirmation: Boolean!
    eventReminders:     Boolean!
    ticketAssigned:     Boolean!
    assignmentRevoked:  Boolean!
    postEventFollowUp:  Boolean!
  }

  type NotificationSmsPrefs {
    masterOptOut:       Boolean!
    eventDayReminders:  Boolean!
    checkInConfirmation: Boolean!
  }

  type NotificationPrefs {
    email: NotificationEmailPrefs!
    sms:   NotificationSmsPrefs!
  }

  type ActiveSession {
    sessionId:  ID!
    userAgent:  String
    ip:         String
    lastUsedAt: DateTime
    isCurrent:  Boolean!
  }

  type AccountExportStatus {
    status:      String!     # 'queued' | 'processing' | 'ready' | 'expired'
    downloadUrl: String
    expiresAt:   DateTime
  }

  input UpdateProfileInput {
    name:  String
    phone: String
    bio:   String
  }

  input UpdateNotificationPrefsInput {
    email: UpdateEmailPrefsInput
    sms:   UpdateSmsPrefsInput
  }

  input UpdateEmailPrefsInput {
    ticketConfirmation:  Boolean
    eventReminders:      Boolean
    ticketAssigned:      Boolean
    assignmentRevoked:   Boolean
    postEventFollowUp:   Boolean
  }

  input UpdateSmsPrefsInput {
    masterOptOut:        Boolean
    eventDayReminders:   Boolean
    checkInConfirmation: Boolean
  }

  extend type User {
    bio:               String
    notificationPrefs: NotificationPrefs!
  }

  extend type Query {
    myActiveSessions: [ActiveSession!]!
    myExportStatus: AccountExportStatus
  }

  extend type Mutation {
    # Profile
    updateProfile(input: UpdateProfileInput!): User!
    uploadAvatar(base64Image: String!, mimeType: String!): User!
    removeAvatar: User!

    # Email change
    requestEmailChange(newEmail: String!): Boolean!
    confirmEmailChange(token: String!): User!

    # Password
    changePassword(currentPassword: String!, newPassword: String!): Boolean!
    setPassword(newPassword: String!): Boolean!

    # Phone
    updatePhone(phone: String!): User!

    # Notification preferences
    updateNotificationPrefs(input: UpdateNotificationPrefsInput!): User!

    # Security
    revokeSession(sessionId: ID!): Boolean!
    revokeAllOtherSessions: Boolean!

    # Danger zone
    requestAccountDeletion: Boolean!
    cancelAccountDeletion: Boolean!
    requestDataExport: Boolean!
  }
`;
