import { TicketConfirmationJobData } from '../jobs/email.job';
import { logger } from '../lib/logger';

export class EmailService {
  /**
   * Stubbed: Send a ticket confirmation email.
   * Resend integration is currently on hold.
   */
  async sendTicketConfirmation(data: TicketConfirmationJobData): Promise<void> {
    try {
      logger.info('Stubbed EmailService: Ticket confirmation email requested', { 
        orderId: data.orderId,
        to: data.to,
        eventTitle: data.eventTitle 
      });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      logger.info('Stubbed EmailService: Email "sent" successfully', { orderId: data.orderId });
    } catch (err: any) {
      logger.error('Stubbed EmailService: Failed to "send" ticket confirmation email', { 
        orderId: data.orderId, 
        error: err.message 
      });
      throw err;
    }
  }
}
