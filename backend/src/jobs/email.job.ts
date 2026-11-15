/**
 * BullMQ Queue names
 */
export const EMAIL_QUEUE_NAME = 'email';

/**
 * Types of email jobs
 */
export enum EmailJobType {
  TICKET_CONFIRMATION = 'ticket_confirmation',
}

/**
 * Data required for a ticket confirmation email
 */
export interface TicketConfirmationJobData {
  type: EmailJobType.TICKET_CONFIRMATION;
  to: string;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  orderId: string;
  tickets: Array<{
    issuanceId: string;
    ticketTierName: string;
    qrToken: string;
    seatInfo?: string;
  }>;
  totalPaid: number; // in cents
  currency: string;
}

/**
 * Union of all email job data types
 */
export type EmailJobData = TicketConfirmationJobData;
