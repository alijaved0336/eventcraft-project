import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import { authenticate } from '../../middleware/authenticate';
import { SessionService } from '../../services/session.service';
import { CreateSessionInputSchema, UpdateSessionInputSchema } from '../../validators/session.validator';
import type { IUserDocument } from '../../models/user.model';

export const sessionRouter: any = Router();

/**
 * @openapi
 * /api/sessions:
 *   post:
 *     summary: Create a new session
 *     description: Create a session for an event. Requires event organizer or admin permissions.
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSessionInput'
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
sessionRouter.post(
  '/',
  authenticate as RequestHandler,
  (async (req: any, res: any, next: any) => {
    try {
      const user = req.user as unknown as IUserDocument;
      const validated = CreateSessionInputSchema.parse(req.body);

      const session = await SessionService.createSession(validated, user.id, user.role);
      (res as any).status(201).json(session);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
);

/**
 * @openapi
 * /api/sessions/event/{eventId}:
 *   get:
 *     summary: Get all sessions for an event
 *     description: Retrieve the schedule (list of sessions) for a specific event.
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event
 *     responses:
 *       200:
 *         description: List of sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Session'
 *       404:
 *         description: Event not found
 */
sessionRouter.get('/event/:eventId', (async (req: any, res: any, next: any) => {
  try {
    const eventId = (req.params as any)['eventId'] as string;
    const sessions = await SessionService.getEventSchedule(eventId);
    (res as any).json(sessions);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * @openapi
 * /api/sessions/{id}:
 *   patch:
 *     summary: Update a session by ID
 *     description: Update an existing session. Requires event organizer or admin permissions.
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the session to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSessionInput'
 *     responses:
 *       200:
 *         description: Session updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Session not found
 */
sessionRouter.patch(
  '/:id',
  authenticate as RequestHandler,
  (async (req: any, res: any, next: any) => {
    try {
      const user = req.user as unknown as IUserDocument;
      const id = (req.params as any)['id'] as string;
      const validated = UpdateSessionInputSchema.parse(req.body);

      const updated = await SessionService.updateSession(id, validated, user.id, user.role);
      (res as any).json(updated);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
);

/**
 * @openapi
 * /api/sessions/{id}:
 *   delete:
 *     summary: Delete a session by ID
 *     description: Delete a session. Requires event organizer or admin permissions.
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the session to delete
 *     responses:
 *       204:
 *         description: Session deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Session not found
 */
sessionRouter.delete(
  '/:id',
  authenticate as RequestHandler,
  (async (req: any, res: any, next: any) => {
    try {
      const user = req.user as unknown as IUserDocument;
      const id = (req.params as any)['id'] as string;

      await SessionService.deleteSession(id, user.id, user.role);
      (res as any).status(204).end();
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
);
