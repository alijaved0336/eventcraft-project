export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  avatar?: string | null;
  notificationPrefs: NotificationPrefs;
}

export interface NotificationPrefs {
  email: EmailPrefs;
  sms: SmsPrefs;
}

export interface EmailPrefs {
  ticketConfirmation: boolean;
  eventReminders: boolean;
  ticketAssigned: boolean;
  assignmentRevoked: boolean;
  postEventFollowUp: boolean;
}

export interface SmsPrefs {
  masterOptOut: boolean;
  eventDayReminders: boolean;
  checkInConfirmation: boolean;
}

export interface ActiveSession {
  sessionId: string;
  userAgent: string;
  ip: string;
  lastUsedAt: string;
  isCurrent: boolean;
}

export interface ExportStatus {
  status: 'queued' | 'processing' | 'ready' | 'expired';
  downloadUrl?: string;
  expiresAt?: string;
}

export interface UpdateProfileInput {
  name?: string | undefined;
  phone?: string | undefined;
  bio?: string | undefined;
}

export interface UpdateNotificationPrefsInput {
  email?: Partial<EmailPrefs> | undefined;
  sms?: Partial<SmsPrefs> | undefined;
}
export interface UpdateNotificationPrefsMutation {
  updateNotificationPrefs: {
    __typename: 'User';
    _id: string;
    notificationPrefs: NotificationPrefs;
  };
}

export interface UploadAvatarData {
  uploadAvatar: {
    __typename: 'User';
    _id: string;
    avatar: string;
  };
}
