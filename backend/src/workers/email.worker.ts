import { Worker, type Job } from 'bullmq';
import { redis } from '../lib/redis';
import { EMAIL_QUEUE_NAME, EmailJobType, type EmailJobData } from '../jobs/email.job';
import { EmailService } from '../services/email.service';
import { logger } from '../lib/logger';

const emailService = new EmailService();

/**
 * BullMQ Worker for processing email jobs.
 */
export const emailWorker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  async (job: Job<EmailJobData>) => {
    logger.info(`Processing email job: ${job.id}`, { type: job.data.type });

    switch (job.data.type) {
      case EmailJobType.TICKET_CONFIRMATION:
        await emailService.sendTicketConfirmation(job.data);
        break;
      default:
        logger.error(`Unknown email job type: ${(job.data as any).type}`);
        throw new Error(`Unknown email job type`);
    }
  },
  {
    connection: redis,
    concurrency: 10,
    // Add removeOnComplete/removeOnFail to worker options if desired, 
    // or set per-job when adding to queue.
  }
);

emailWorker.on('completed', (job) => {
  logger.info(`✅ Email job ${job.id} delivered`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`❌ Email job ${job?.id} failed after retries`, { error: err.message });
});

logger.info(`Email worker initialized and listening on queue: ${EMAIL_QUEUE_NAME}`);
