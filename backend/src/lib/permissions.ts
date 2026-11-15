export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  HOST = 'host',
  ATTENDEE = 'attendee',
  GUEST = 'guest',
  SYSTEM = 'system',
}

export enum Permission {
  // ── Events ──────────────────────────────────────────────
  EVENT_CREATE = 'EVENT_CREATE',          // create a new event
  EVENT_READ = 'EVENT_READ',            // view event details
  EVENT_UPDATE = 'EVENT_UPDATE',          // edit event fields
  EVENT_DELETE = 'EVENT_DELETE',          // soft delete an event
  EVENT_PUBLISH = 'EVENT_PUBLISH',         // change status draft → published
  EVENT_CANCEL = 'EVENT_CANCEL',          // cancel a published/scheduled event

  // ── Agenda ──────────────────────────────────────────────
  AGENDA_READ = 'AGENDA_READ',           // view sessions + speakers
  AGENDA_CREATE = 'AGENDA_CREATE',         // add a session
  AGENDA_UPDATE = 'AGENDA_UPDATE',         // edit a session
  AGENDA_DELETE = 'AGENDA_DELETE',         // remove a session

  // ── Tickets ─────────────────────────────────────────────
  TICKET_CREATE = 'TICKET_CREATE',         // create a ticket tier
  TICKET_UPDATE = 'TICKET_UPDATE',         // edit tier (price, capacity, status)
  TICKET_DELETE = 'TICKET_DELETE',         // remove a tier
  TICKET_PURCHASE = 'TICKET_PURCHASE',       // buy a ticket (register)
  TICKET_VIEW_SALES = 'TICKET_VIEW_SALES',     // see how many sold + revenue
  TICKET_REFUND = 'TICKET_REFUND',         // issue a refund via Stripe

  // ── Attendees ────────────────────────────────────────────
  ATTENDEE_VIEW = 'ATTENDEE_VIEW',         // see the attendee list
  ATTENDEE_CHECKIN = 'ATTENDEE_CHECKIN',      // mark attendee as checked in
  ATTENDEE_REMOVE = 'ATTENDEE_REMOVE',       // remove attendee from event
  ATTENDEE_EXPORT = 'ATTENDEE_EXPORT',       // export attendee list as CSV

  // ── Automation ───────────────────────────────────────────
  AUTOMATION_CREATE = 'AUTOMATION_CREATE',     // create a rule
  AUTOMATION_UPDATE = 'AUTOMATION_UPDATE',     // edit a rule
  AUTOMATION_DELETE = 'AUTOMATION_DELETE',     // delete a rule
  AUTOMATION_TOGGLE = 'AUTOMATION_TOGGLE',     // pause / resume a rule

  // ── Notifications ────────────────────────────────────────
  NOTIFICATION_SEND = 'NOTIFICATION_SEND',     // manually trigger email/SMS blast

  // ── Analytics ────────────────────────────────────────────
  ANALYTICS_VIEW = 'ANALYTICS_VIEW',        // view charts + metrics dashboard
  ANALYTICS_VIEW_ALL = 'ANALYTICS_VIEW_ALL',    // God view for all platform events

  // ── Media / Uploads ──────────────────────────────────────
  MEDIA_UPLOAD = 'MEDIA_UPLOAD',          // upload banner images to S3

  // ── Platform (super_admin only) ──────────────────────────
  USER_VIEW = 'USER_VIEW',             // list all platform users
  USER_UPDATE = 'USER_UPDATE',           // edit user role / status
  USER_DELETE = 'USER_DELETE',           // soft delete a user
  PLATFORM_SETTINGS = 'PLATFORM_SETTINGS',     // access platform-level config
}

export type AccessLevel = '✓' | 'own' | 'assigned' | '-';

export const ROLE_PERMISSIONS: Record<UserRole, Partial<Record<Permission, AccessLevel>>> = {
  // ── SUPER ADMIN: Platform-wide access ──────────────────
  [UserRole.SUPER_ADMIN]: Object.values(Permission).reduce((acc, p) => {
    acc[p as Permission] = '✓';
    return acc;
  }, {} as Partial<Record<Permission, AccessLevel>>),

  // ── ADMIN: Full control over all events (not platform) ──
  [UserRole.ADMIN]: Object.values(Permission).reduce((acc, p) => {
    const perm = p as Permission;
    // Admins have '✓' (any) for all EVENT_, AGENDA_, TICKET_ etc.
    // They are only restricted from platform-level User Management.
    if ([Permission.USER_VIEW, Permission.USER_UPDATE, Permission.USER_DELETE, Permission.PLATFORM_SETTINGS].includes(perm)) {
      acc[perm] = '-';
    } else if (perm === Permission.ANALYTICS_VIEW_ALL) {
      acc[perm] = '✓';
    } else {
      acc[perm] = '✓';
    }
    return acc;
  }, {} as Partial<Record<Permission, AccessLevel>>),

  // ── ORGANIZER: Full control over their own events ───────
  [UserRole.ORGANIZER]: {
    [Permission.EVENT_CREATE]: '✓',
    [Permission.EVENT_READ]: 'own',
    [Permission.EVENT_UPDATE]: '✓',
    [Permission.EVENT_DELETE]: '✓',
    [Permission.EVENT_PUBLISH]: 'own',
    [Permission.EVENT_CANCEL]: 'own',
    
    [Permission.AGENDA_READ]: '✓',
    [Permission.AGENDA_CREATE]: 'own',
    [Permission.AGENDA_UPDATE]: 'own',
    [Permission.AGENDA_DELETE]: 'own',
    
    [Permission.TICKET_CREATE]: 'own',
    [Permission.TICKET_UPDATE]: 'own',
    [Permission.TICKET_DELETE]: 'own',
    [Permission.TICKET_PURCHASE]: '✓',
    [Permission.TICKET_VIEW_SALES]: 'own',
    [Permission.TICKET_REFUND]: 'own',
    
    [Permission.ATTENDEE_VIEW]: 'own',
    [Permission.ATTENDEE_CHECKIN]: 'own',
    [Permission.ATTENDEE_REMOVE]: 'own',
    [Permission.ATTENDEE_EXPORT]: 'own',
    
    [Permission.AUTOMATION_CREATE]: 'own',
    [Permission.AUTOMATION_UPDATE]: 'own',
    [Permission.AUTOMATION_DELETE]: 'own',
    [Permission.AUTOMATION_TOGGLE]: 'own',
    
    [Permission.NOTIFICATION_SEND]: 'own',
    [Permission.ANALYTICS_VIEW]: 'own',
    [Permission.MEDIA_UPLOAD]: '✓',
  },

  // ── HOST: Staff on someone else's event ─────────────────
  // "Didn't create it, they don't own it. create x, edit x, delete x, publish x"
  [UserRole.HOST]: {
    [Permission.EVENT_READ]: 'assigned',   // Only read events they are staff on
    [Permission.AGENDA_READ]: 'assigned',
    [Permission.AGENDA_CREATE]: 'assigned',
    [Permission.AGENDA_UPDATE]: 'assigned',
    [Permission.TICKET_PURCHASE]: '✓',
    [Permission.ATTENDEE_VIEW]: 'assigned',
    [Permission.ATTENDEE_CHECKIN]: 'assigned',
    [Permission.ANALYTICS_VIEW]: 'assigned',
  },

  // ── ATTENDEE: Zero management rights ───────────────────
  [UserRole.ATTENDEE]: {
    [Permission.EVENT_READ]: '✓',          // Can browse all public events
    [Permission.AGENDA_READ]: '✓',         // Can see schedules
    [Permission.TICKET_PURCHASE]: '✓',     // Can buy tickets
  },

  [UserRole.GUEST]: {
    [Permission.EVENT_READ]: '✓',
    [Permission.AGENDA_READ]: '✓',
  },

  [UserRole.SYSTEM]: Object.values(Permission).reduce((acc, p) => {
    acc[p as Permission] = '✓';
    return acc;
  }, {} as Partial<Record<Permission, AccessLevel>>),
};
