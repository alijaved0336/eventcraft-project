import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { RoomService } from '../../services/attendance/room.service';
import { IUserDocument } from '../../models/user.model';
import { logger } from '../../lib/logger';

export const livestreamRouter: any = Router();
const roomService = new RoomService();

/**
 * @openapi
 * /api/livestream/{eventId}/connect:
 *   post:
 *     summary: Provision/Connect to a Daily.co room for an event
 *     description: Returns host and join URLs. Requires organizer authorization.
 *     tags: [Livestream]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Room data
 */
livestreamRouter.post(
  '/:eventId/connect',
  authenticate as RequestHandler,
  (async (req: any, res: any, next: any) => {
    try {
      const user = req.user as unknown as IUserDocument;
      const eventId = req.params.eventId;
      
      const session = await roomService.createEventRoom(
        eventId, 
        { id: user.id, email: user.email },
        true // Connect REST call typically implies refreshing/provisioning
      );
      res.json(session);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);

/**
 * @openapi
 * /api/livestream/{eventId}/end:
 *   post:
 *     summary: Manually end a video session and teardown room
 *     tags: [Livestream]
 *     security:
 *       - bearerAuth: []
 */
livestreamRouter.post(
  '/:eventId/end',
  authenticate as RequestHandler,
  (async (req: any, res: any, next: any) => {
    try {
      const user = req.user as unknown as IUserDocument;
      const eventId = req.params.eventId;
      
      const result = await roomService.endRoom(eventId, user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);

/**
 * @openapi
 * /api/livestream/{eventId}/ticket/{issuanceId}/token:
 *   post:
 *     summary: Issue a personalized attendee token for a private room
 *     tags: [Livestream]
 */
livestreamRouter.post(
  '/:eventId/ticket/:issuanceId/token',
  authenticate as RequestHandler,
  (async (req: any, res: any, next: any) => {
    try {
      const user = req.user as unknown as IUserDocument;
      const eventId = req.params.eventId;
      const issuanceId = req.params.issuanceId;
      
      const result = await roomService.issueAttendeeToken(
        eventId, 
        issuanceId,
        { id: user.id, email: user.email }
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);
