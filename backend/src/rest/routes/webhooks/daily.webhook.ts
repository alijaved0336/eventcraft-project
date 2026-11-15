import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { config } from '../../../config';
import { logger } from '../../../lib/logger';
import { emitToEventRoom } from '../../../lib/socket';
import { EventModel } from '../../../models/event.model';

export const dailyWebhookRouter: Router = Router();

const verifyDailySignature = (signature: string, body: string): boolean => {
  if (!config.dailyWebhookSecret) {
    logger.warn('DAILY_WEBHOOK_SECRET not configured, skipping signature verification.');
    return true; // For dev, but should be false in prod
  }
  
  const hmac = crypto.createHmac('sha256', config.dailyWebhookSecret);
  hmac.update(body);
  const expected = hmac.digest('hex');
  return signature === expected;
};

// Webhook endpoint (expects raw body)
dailyWebhookRouter.post('/', async (req: Request, res: Response) => {
  const signature = req.headers['x-daily-signature'] as string;
  const rawBody = (req as any).rawBody || JSON.stringify(req.body); // Fallback if rawBody middleware missed

  if (!verifyDailySignature(signature, rawBody)) {
    logger.warn('Invalid Daily.co webhook signature');
    res.status(401).send('Unauthorized');
    return;
  }

  const event = req.body;
  const roomName = event.payload?.room || event.room;
  if (!roomName) {
    res.sendStatus(200);
    return;
  }

  const eventId = roomName.replace('event-', '');
  const action = event.action;

  try {
    if (action === 'participant-joined') {
      const updatedEvent = await EventModel.findByIdAndUpdate(
        eventId,
        { $inc: { 'virtualSession.currentAttendees': 1 } },
        { new: true }
      );

      if (updatedEvent?.virtualSession) {
        const current = updatedEvent.virtualSession.currentAttendees;
        const peak = updatedEvent.virtualSession.peakAttendees;

        if (current > peak) {
          await EventModel.findByIdAndUpdate(eventId, { 
            'virtualSession.peakAttendees': current 
          });
        }
        
        emitToEventRoom(eventId, 'attendee-update', { virtual: Math.max(0, current) });
        logger.info(`Daily Webhook: Participant joined room ${roomName}. Current: ${current}`);
      }
    }

    if (action === 'participant-left') {
      const updatedEvent = await EventModel.findByIdAndUpdate(
        eventId,
        { $inc: { 'virtualSession.currentAttendees': -1 } },
        { new: true }
      );

      if (updatedEvent?.virtualSession) {
        const current = updatedEvent.virtualSession.currentAttendees;
        emitToEventRoom(eventId, 'attendee-update', { virtual: Math.max(0, current) });
        logger.info(`Daily Webhook: Participant left room ${roomName}. Current: ${current}`);
      }
    }

    if (action === 'recording-ready') {
      const downloadUrl = event.payload?.download_link || event.download_link;
      if (downloadUrl) {
        await EventModel.findByIdAndUpdate(eventId, { 
          'virtualSession.recordingUrl': downloadUrl 
        });
        logger.info(`Daily Webhook: Recording ready for event ${eventId}: ${downloadUrl}`);
        // TODO: Trigger automation notifications
      }
    }
  } catch (err: any) {
    logger.error('Error processing Daily.co webhook:', err);
  }

  res.sendStatus(200);
});
