import { EventRepository } from '../repositories/event.repository';
import type { CreateEventInput, UpdateEventInput } from '../validators/event.validator';
import { EventModel, type IEventDocument, EventStatus, EventVisibility } from '../models/event.model';
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from '../errors';
import mongoose from 'mongoose';
import { Permission, UserRole } from '../lib/permissions';
import { logger } from '../lib/logger';
import { assertAccess } from '../middleware/rbac';
import { TicketTypeRepository } from '../repositories/ticket-type.repository';
import { EventMemberModel } from '../models/event-member.model';
import { TicketIssuanceModel, TicketIssuanceStatus } from '../models/ticket-issuance.model';
import { uploadEventBanner, deleteEventBanner, isBase64DataUri } from './upload.service';

export class EventService {
  private static ticketTypeRepository = new TicketTypeRepository();
  private static readonly ALLOWED_TRANSITIONS: Record<
    EventStatus,
    Partial<Record<EventStatus, UserRole[]>>
  > = {
    [EventStatus.DRAFT]: {
      [EventStatus.PUBLISHED]: [UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      [EventStatus.SCHEDULED]: [UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      [EventStatus.CANCELLED]: [UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      [EventStatus.ENDED]: [UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    [EventStatus.PUBLISHED]: {
      [EventStatus.SCHEDULED]: [UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      [EventStatus.CANCELLED]: [UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      [EventStatus.ENDED]: [
        UserRole.ORGANIZER,
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
        UserRole.SYSTEM,
      ],
    },
    [EventStatus.SCHEDULED]: {
      [EventStatus.PUBLISHED]: [UserRole.SYSTEM],
      [EventStatus.CANCELLED]: [UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      [EventStatus.ENDED]: [
        UserRole.ORGANIZER,
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
        UserRole.SYSTEM,
      ],
    },
    [EventStatus.CANCELLED]: {},
    [EventStatus.ENDED]: {},
  };

  private static validateStatusTransition(current: EventStatus, next: EventStatus, role: UserRole) {
    if (current === next) return;
    const allowedRoles = this.ALLOWED_TRANSITIONS[current]?.[next] || [];
    if (!allowedRoles.includes(role)) {
      throw new ForbiddenError(
        `Invalid status transition from ${current} to ${next} for role ${role}`,
      );
    }
  }

  static async createEvent(
    data: CreateEventInput,
    userId: string,
    userRole: UserRole,
  ): Promise<IEventDocument> {
    await assertAccess(Permission.EVENT_CREATE, { id: userId, role: userRole });

    if (typeof data.location === 'string') {
      data.location = { address: data.location };
    }

    // Upload banner to Cloudinary if a new Base64 image is provided
    let bannerFields: { bannerImage?: string; bannerUrl?: string; bannerPublicId?: string } = {};
    if (data.bannerImage && isBase64DataUri(data.bannerImage)) {
      const upload = await uploadEventBanner(data.bannerImage);
      bannerFields = {
        bannerImage: upload.bannerImage,
        bannerUrl: upload.bannerUrl,
        bannerPublicId: upload.publicId,
      };
    }

    const eventData = {
      ...data,
      ...bannerFields,
      organizerId: new mongoose.Types.ObjectId(userId),
    };

    const event = await EventRepository.create(eventData as Partial<IEventDocument>);

    let finalEvent = event;
    // Sync ticket tiers to standalone TicketType collection
    if (data.ticketTiers && data.ticketTiers.length > 0) {
      const tickets = data.ticketTiers.map((t) => ({
        eventId: event._id,
        name: t.name,
        price: t.price,
        capacity: t.capacity,
        description: t.description,
        currency: data.currency || 'USD',
      }));
      const createdTickets = await EventService.ticketTypeRepository.createMany(tickets);
      const updated = await EventRepository.updateById(event.id, {
        ticketTypes: createdTickets.map((t) => t._id),
      });
      if (updated) finalEvent = updated;
    }

    logger.info('Event created', { eventId: finalEvent.id, organizerId: userId });
    return finalEvent;
  }

  static async getEventDetails(
    idOrSlug: string,
    currentUser?: { userId: string; role: UserRole },
  ): Promise<IEventDocument> {
    let event: IEventDocument | null = null;

    if (mongoose.isValidObjectId(idOrSlug)) {
      event = await EventRepository.findById(idOrSlug);
    }
    if (!event) {
      event = await EventRepository.findBySlug(idOrSlug);
    }

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // RBAC: Published, Scheduled, and Ended events are public if visibility is PUBLIC.
    // Anything else (Draft, Cancelled, or Private) requires READ permission.
    const isPubliclyVisibleStatus = [
      EventStatus.PUBLISHED,
      EventStatus.SCHEDULED,
      EventStatus.ENDED,
    ].includes(event.status);
    const isPublicVisibility = event.visibility === EventVisibility.PUBLIC;

    if (!(isPubliclyVisibleStatus && isPublicVisibility)) {
      if (!currentUser) {
        throw new UnauthorizedError('Private or non-published event details require login');
      }
      await assertAccess(
        Permission.EVENT_READ,
        { id: currentUser.userId, role: currentUser.role },
        { organizerId: (event.organizerId as any)._id || event.organizerId },
      );
    }

    return event;
  }

  static async getEventDetailsById(
    id: string,
    currentUser?: { userId: string; role: UserRole },
  ): Promise<IEventDocument> {
    const event = await EventRepository.findByIdFull(id);

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // RBAC: Published, Scheduled, and Ended events are public if visibility is PUBLIC.
    const isPubliclyVisibleStatus = [
      EventStatus.PUBLISHED,
      EventStatus.SCHEDULED,
      EventStatus.ENDED,
    ].includes(event.status);
    const isPublicVisibility = event.visibility === EventVisibility.PUBLIC;

    if (!(isPubliclyVisibleStatus && isPublicVisibility)) {
      if (!currentUser) {
        throw new UnauthorizedError('Private or non-published event details require login');
      }
      await assertAccess(
        Permission.EVENT_READ,
        { id: currentUser.userId, role: currentUser.role },
        { organizerId: (event.organizerId as any)._id || event.organizerId },
      );
    }

    return event;
  }

  static async getEvents(
    filter: Record<string, unknown> = {},
    currentUser?: { userId: string; role: UserRole },
    limit: number = 20,
    skip: number = 0,
  ): Promise<IEventDocument[]> {
    // If Admin/SuperAdmin/System/Attendee, allow seeing all unfiltered
    if (
      currentUser &&
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SYSTEM, UserRole.ATTENDEE].includes(
        currentUser.role,
      )
    ) {
      return EventRepository.findAll(filter, limit, skip);
    }

    // For others: return Published/Scheduled public events + their own events + events they are attending/staffing
    const relatedEventIds: mongoose.Types.ObjectId[] = [];
    if (currentUser) {
      const userOid = new mongoose.Types.ObjectId(currentUser.userId);

      // Parallel fetch memberships and tickets
      const [memberships, tickets] = await Promise.all([
        EventMemberModel.find({ userId: userOid }).select('eventId').lean(),
        TicketIssuanceModel.find({ userId: userOid, deletedAt: null }).select('eventId').lean(),
      ]);

      relatedEventIds.push(...memberships.map((m: any) => m.eventId));
      relatedEventIds.push(...tickets.map((t: any) => t.eventId));
    }

    const finalFilter = {
      ...filter,
      $or: [
        // a) Publicly visible events (Published/Scheduled/Ended)
        {
          status: { $in: [EventStatus.PUBLISHED, EventStatus.SCHEDULED, EventStatus.ENDED] },
          visibility: EventVisibility.PUBLIC,
        },
        // b) If logged in: events they organize, staff, or attend
        ...(currentUser
          ? [
              { organizerId: new mongoose.Types.ObjectId(currentUser.userId) },
              { _id: { $in: relatedEventIds } },
            ]
          : []),
      ],
    };

    return EventRepository.findAll(finalFilter, limit, skip);
  }


  static async updateEvent(
    id: string,
    data: UpdateEventInput,
    userId: string,
    userRole: UserRole,
  ): Promise<IEventDocument> {
    const existing = await EventRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Event not found');
    }

    await assertAccess(
      Permission.EVENT_UPDATE,
      { id: userId, role: userRole },
      {
        organizerId: (existing.organizerId as any)._id || existing.organizerId,
      },
    );

    if (data.location && typeof data.location === 'string') {
      data.location = { address: data.location };
    }

    // Upload banner to Cloudinary if a new Base64 image is provided
    let bannerFields: { bannerImage?: string; bannerUrl?: string; bannerPublicId?: string } = {};
    if (data.bannerImage && isBase64DataUri(data.bannerImage)) {
      // Delete old Cloudinary asset if present
      const oldPublicId = (existing as any).bannerPublicId;
      if (oldPublicId) {
        await deleteEventBanner(oldPublicId);
      }
      const upload = await uploadEventBanner(data.bannerImage);
      bannerFields = {
        bannerImage: upload.bannerImage,
        bannerUrl: upload.bannerUrl,
        bannerPublicId: upload.publicId,
      };
    }

    if (data.status) {
      this.validateStatusTransition(existing.status, data.status as EventStatus, userRole);
    }

    const updated = await EventRepository.updateById(id, {
      ...(data as Partial<IEventDocument>),
      ...bannerFields,
    } as Partial<IEventDocument>);
    if (!updated) {
      throw new NotFoundError('Event not found after update');
    }

    let finalUpdated = updated;
    // Sync ticket tiers if updated
    if (data.ticketTiers) {
      const tickets = data.ticketTiers.map((t) => ({
        name: t.name,
        price: t.price,
        capacity: t.capacity,
        description: t.description,
        currency: data.currency || updated.currency || 'USD',
        isActive: true,
      }));
      const syncedTickets = await EventService.ticketTypeRepository.upsertMany(id, tickets);
      const reUpdated = await EventRepository.updateById(id, {
        ticketTypes: syncedTickets.map((t) => t._id),
      });
      if (reUpdated) finalUpdated = reUpdated;
    }

    logger.info('Event updated', { eventId: id, userId });
    return finalUpdated;
  }

  static async deleteEvent(id: string, userId: string, userRole: UserRole): Promise<void> {
    const existing = await EventRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Event not found');
    }

    await assertAccess(
      Permission.EVENT_DELETE,
      { id: userId, role: userRole },
      {
        organizerId: (existing.organizerId as any)._id || existing.organizerId,
      },
    );

    // Safety Check: Prevent deletion if active or checked-in tickets exist
    const activeTicketsCount = await TicketIssuanceModel.countDocuments({
      eventId: id,
      status: { $in: [TicketIssuanceStatus.ACTIVE, TicketIssuanceStatus.CHECKED_IN] },
      deletedAt: null
    });

    if (activeTicketsCount > 0) {
      throw new ValidationError(
        `Cannot delete event with ${activeTicketsCount} active or checked-in tickets. ` +
        'Please cancel or refund all tickets first to ensure attendee communication and data integrity.'
      );
    }

    await EventRepository.softDeleteById(id);
    logger.info('Event deleted', { eventId: id, userId });
  }

  static async publishEvent(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<IEventDocument> {
    const existing = await EventRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Event not found');
    }

    await assertAccess(
      Permission.EVENT_PUBLISH,
      { id: userId, role: userRole },
      {
        organizerId: (existing.organizerId as any)._id || existing.organizerId,
      },
    );

    this.validateStatusTransition(existing.status, EventStatus.PUBLISHED, userRole);

    const updated = await EventRepository.updateById(id, { status: EventStatus.PUBLISHED });
    if (!updated) {
      throw new NotFoundError('Event not found after update');
    }

    logger.info('Event published', { eventId: id, userId });
    return updated;
  }

  static async getTicketTypes(eventId: string) {
    return await this.ticketTypeRepository.findByEventId(eventId);
  }

  static async getFeaturedEvents(limit: number = 6): Promise<IEventDocument[]> {
    return await EventRepository.findFeatured(limit);
  }
  static async discoverEvents(
    query?: string,
    lat?: number,
    lng?: number,
    radiusInMeters?: number,
    date?: string,
    limit?: number,
    offset?: number
  ) {
    return await EventRepository.discoverEvents(query, lat, lng, radiusInMeters, date, limit, offset);
  }

  static async autocompleteEvents(query: string, limit?: number) {
    return await EventRepository.autocompleteEvents(query, limit);
  }
}
