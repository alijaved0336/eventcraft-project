import { Router, type RequestHandler } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate';
import { EventService } from '../../services/event.service';
import { CreateEventInputSchema, UpdateEventInputSchema } from '../../validators/event.validator';
import type { IUserDocument } from '../../models/user.model';

export const eventRouter: any = Router();

/**
 * @openapi
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     description: Create an event. Requires authentication.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: 'string' }
 *               description: { type: 'string' }
 *               type: { $ref: '#/components/schemas/EventType' }
 *               status: { $ref: '#/components/schemas/EventStatus' }
 *               visibility: { $ref: '#/components/schemas/EventVisibility' }
 *               startDate: { type: 'string', format: 'date-time' }
 *               endDate: { type: 'string', format: 'date-time' }
 *               timezone: { type: 'string' }
 *               location: { $ref: '#/components/schemas/Location' }
 *               bannerImage: { type: 'string' }
 *               tags: { type: 'array', items: { type: 'string' } }
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
eventRouter.post(
  '/',
  authenticate as RequestHandler,
  (async (req: any, res: any, next: any) => {
    try {
      const user = req.user as unknown as IUserDocument;
      const validated = CreateEventInputSchema.parse(req.body);

      const event = await EventService.createEvent(validated, user.id, user.role);
      (res as any).status(201).json(event);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
);

/**
 * @openapi
 * /api/events:
 *   get:
 *     summary: List all active events
 *     description: Retrieve a list of all non-deleted events.
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
eventRouter.get(
  '/',
  optionalAuthenticate as RequestHandler,
  (async (req: any, res: any, next: any) => {
    try {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
      // Future: parse query params for filtering/pagination
      const events = await EventService.getEvents({}, req.user as any);
      const result = events.map((e: any) => {
        const eventObj = { ...e, id: e._id.toString() };
        const organizerId = (e.organizerId as any)?._id?.toString() || e.organizerId?.toString();
        return {
          ...eventObj,
          isOwner: req.user ? organizerId === req.user.userId : false,
        };
      });
      (res as any).json(result);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
);

/**
 * @openapi
 * /api/events/featured:
 *   get:
 *     summary: List top 6 featured events for landing page
 *     description: Retrieve the top 6 upcoming public events. No authentication required.
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of featured events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
eventRouter.get(
  '/featured',
  optionalAuthenticate as RequestHandler,
  (async (_req: any, res: any, next: any) => {
  try {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    const events = await EventService.getFeaturedEvents(6);
    (res as any).json(events);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * @openapi
 * /api/events/{idOrSlug}:
 *   get:
 *     summary: Get event details by ID or slug
 *     description: Retrieve details of a single event using its MongoDB ID or its unique slug.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID or slug of the event
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */
eventRouter.get(
  '/:idOrSlug',
  optionalAuthenticate as RequestHandler,
  (async (req: any, res: any, next: any) => {
  try {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    const idOrSlug = (req.params as any)['idOrSlug'] as string;
    if (!idOrSlug) throw new Error('Missing idOrSlug');

    const event = await EventService.getEventDetails(idOrSlug, req.user as any);
    const eventObj = { ...(event as any), id: (event as any)._id.toString() };
    const organizerId =
      (event.organizerId as any)?._id?.toString() || event.organizerId?.toString();
    const result = {
      ...eventObj,
      isOwner: req.user ? organizerId === req.user.userId : false,
    };
    (res as any).json(result);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * @openapi
 * /api/events/details/{id}:
 *   get:
 *     summary: Get full event details by ID
 *     description: Retrieve all details of a single event (including populated ticket types) using its MongoDB ID.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The MongoDB ID of the event
 *     responses:
 *       200:
 *         description: Full event details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 * */
eventRouter.get(
  '/details/:id',
  optionalAuthenticate as RequestHandler,
  (async (req: any, res: any, next: any) => {
    try {
      const id = (req.params as any)['id'] as string;
      if (!id) throw new Error('Missing ID');

      const event = await EventService.getEventDetailsById(id, req.user as any);
      const eventObj = { ...(event as any), id: (event as any)._id.toString() };
      const organizerId =
        (event.organizerId as any)?._id?.toString() || event.organizerId?.toString();

      const result = {
        ...eventObj,
        isOwner: req.user ? organizerId === req.user.userId : false,
      };
      (res as any).json(result);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
);


/**
 * @openapi
 * /api/events/{id}:
 *   patch:
 *     summary: Update an event by ID
 *     description: Update an existing event. Requires ownership or admin permissions.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event to update
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       403:
 *         description: Forbidden - Not the owner or admin
 *       404:
 *         description: Event not found
 */
eventRouter.patch(
  '/:id',
  authenticate as RequestHandler,
  (async (req: any, res: any, next: any) => {
    try {
      const user = req.user as unknown as IUserDocument;
      const id = (req.params as any)['id'] as string;
      if (!id) throw new Error('Missing ID');

      const validated = UpdateEventInputSchema.parse(req.body);
      const updated = await EventService.updateEvent(id, validated, user.id, user.role);

      (res as any).json(updated);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
);

/**
 * @openapi
 * /api/events/{id}:
 *   delete:
 *     summary: Soft delete an event by ID
 *     description: Soft delete an event. Requires ownership or admin permissions.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event to delete
 *     responses:
 *       204:
 *         description: Event deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
eventRouter.delete(
  '/:id',
  authenticate as RequestHandler,
  (async (req: any, res: any, next: any) => {
    try {
      const user = req.user as unknown as IUserDocument;
      const id = (req.params as any)['id'] as string;
      if (!id) throw new Error('Missing ID');

      await EventService.deleteEvent(id, user.id, user.role);
      (res as any).status(204).end();
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
);
