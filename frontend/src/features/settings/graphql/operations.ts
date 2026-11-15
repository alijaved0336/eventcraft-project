import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
      _id
      name
      email
      phone
      bio
      avatar
      notificationPrefs {
        email {
          ticketConfirmation
          eventReminders
          ticketAssigned
          assignmentRevoked
          postEventFollowUp
        }
        sms {
          masterOptOut
          eventDayReminders
          checkInConfirmation
        }
      }
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      _id
      name
      phone
      bio
    }
  }
`;

export const UPLOAD_AVATAR_MUTATION = gql`
  mutation UploadAvatar($base64Image: String!, $mimeType: String!) {
    uploadAvatar(base64Image: $base64Image, mimeType: $mimeType) {
      _id
      avatar
    }
  }
`;

export const REMOVE_AVATAR_MUTATION = gql`
  mutation RemoveAvatar {
    removeAvatar {
      _id
      avatar
    }
  }
`;

export const REQUEST_EMAIL_CHANGE_MUTATION = gql`
  mutation RequestEmailChange($newEmail: String!) {
    requestEmailChange(newEmail: $newEmail)
  }
`;

export const SET_PASSWORD_MUTATION = gql`
  mutation SetPassword($newPassword: String!) {
    setPassword(newPassword: $newPassword)
  }
`;

export const UPDATE_NOTIFICATION_PREFS_MUTATION = gql`
  mutation UpdateNotificationPrefs($input: UpdateNotificationPrefsInput!) {
    updateNotificationPrefs(input: $input) {
      _id
      notificationPrefs {
        email {
          ticketConfirmation
          eventReminders
          ticketAssigned
          assignmentRevoked
          postEventFollowUp
        }
        sms {
          masterOptOut
          eventDayReminders
          checkInConfirmation
        }
      }
    }
  }
`;

export const MY_ACTIVE_SESSIONS_QUERY = gql`
  query MyActiveSessions {
    myActiveSessions {
      sessionId
      userAgent
      ip
      lastUsedAt
      isCurrent
    }
  }
`;

export const REVOKE_SESSION_MUTATION = gql`
  mutation RevokeSession($sessionId: ID!) {
    revokeSession(sessionId: $sessionId)
  }
`;

export const REVOKE_ALL_OTHER_SESSIONS_MUTATION = gql`
  mutation RevokeAllOtherSessions {
    revokeAllOtherSessions
  }
`;

export const REQUEST_ACCOUNT_DELETION_MUTATION = gql`
  mutation RequestAccountDeletion {
    requestAccountDeletion
  }
`;

export const CANCEL_ACCOUNT_DELETION_MUTATION = gql`
  mutation CancelAccountDeletion {
    cancelAccountDeletion
  }
`;

export const REQUEST_DATA_EXPORT_MUTATION = gql`
  mutation RequestDataExport {
    requestDataExport
  }
`;

export const MY_EXPORT_STATUS_QUERY = gql`
  query MyExportStatus {
    myExportStatus {
      status
      downloadUrl
      expiresAt
    }
  }
`;
