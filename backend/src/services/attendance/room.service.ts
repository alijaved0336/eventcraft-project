import { EventModel, EventStatus, type IEventDocument } from '../../models/event.model';
import { TicketIssuanceModel } from '../../models/ticket-issuance.model';
import {
  getDailyRoom,
  createDailyToken,
  createDailyRoom,
  deleteDailyRoom,
} from '../integrations/daily.service';
import { AppError } from '../../errors';
import { Types } from 'mongoose';

export class RoomService {
  async createEventRoom(
    eventId: string,
    organizer: { id: string, email?: string },
    force: boolean = false,
  ) {
    // 1. Fetch event and authorize
    const event = (await EventModel.findById(eventId)) as IEventDocument | null;
    if (!event) throw new AppError(404, 'NOT_FOUND', 'Event not found');

    const storedOrganizerId =
      (event.organizerId as any)?._id?.toString() || event.organizerId?.toString();
    if (storedOrganizerId !== organizer.id) {
      throw new AppError(403, 'FORBIDDEN', 'Not authorized to manage this event');
    }

    if (event.status === EventStatus.CANCELLED) {
      throw new AppError(400, 'BAD_REQUEST', 'Cannot create room for cancelled event');
    }

    // 2. Self-healing/Idempotency check
    if (event.virtualSession?.roomName && !force) {
      const dailyRoom = await getDailyRoom(event.virtualSession.roomName);
      if (dailyRoom) {
        // Return existing session with a FRESH, identity-linked host token
        const hostToken = await createDailyToken(event.virtualSession.roomName, {
          isOwner: true,
          expiryHours: 24,
          userId: organizer.id,
          userName: organizer.email || 'Organizer',
        });

        // Safe conversion of subdocument
        const sessionObj =
          typeof (event.virtualSession as any).toObject === 'function'
            ? (event.virtualSession as any).toObject()
            : event.virtualSession;

        return {
          ...sessionObj,
          hostUrl: `${event.virtualSession.hostUrl}?t=${hostToken.token}`,
        };
      }
    }

    // 3. Provision new Unique Room on Daily.co
    const uniqueSuffix = Date.now().toString(36).slice(-5);
    const uniqueName = `event-${eventId}-${uniqueSuffix}`;

    const dailyRoom = await createDailyRoom(uniqueName, {
      maxParticipants: Math.min(event.capacity || 10, 10),
      expiryHours: 72,
    });

    // 4. Generate host token (owner role)
    const hostToken = await createDailyToken(dailyRoom.name, {
      isOwner: true,
      expiryHours: 24,
      userId: organizer.id,
      userName: organizer.email || 'Organizer',
    });

    // 5. Persist the clean base URL to MongoDB
    const session = {
      _id: new Types.ObjectId(),
      provider: 'daily' as const,
      roomName: dailyRoom.name,
      joinUrl: dailyRoom.url,
      hostUrl: dailyRoom.url, // Base URL only (resolver/service adds token on-the-fly)
      isLive: false,
      peakAttendees: 0,
      expiresAt: dailyRoom.config?.exp ? new Date(dailyRoom.config.exp * 1000) : null,
    };

    await EventModel.findByIdAndUpdate(eventId, { virtualSession: session });

    // 6. Return response with the dynamic token appended
    return {
      ...session,
      hostUrl: `${session.hostUrl}?t=${hostToken.token}`,
    };
  }

  async issueAttendeeToken(
    eventId: string,
    issuanceId: string,
    attendee: { id: string; email?: string }
  ) {
    const event = await EventModel.findById(eventId);
    if (!event?.virtualSession?.roomName) throw new AppError(400, 'BAD_REQUEST', 'Room not created yet');

    const issuance = await TicketIssuanceModel.findOne({ _id: issuanceId, eventId });
    if (!issuance) throw new AppError(404, 'NOT_FOUND', 'Ticket not found');

    // Generate identity-linked attendee token
    const token = await createDailyToken(event.virtualSession.roomName, {
      isOwner: false,
      expiryHours: 24,
      userId: attendee.id,
      userName: attendee.email || 'Attendee',
    });

    const joinUrl = `${event.virtualSession.joinUrl}?t=${token.token}`;
    const joinToken = token.token;

    await TicketIssuanceModel.findByIdAndUpdate(issuanceId, {
      joinType: 'virtual',
      joinTokenRef: joinToken.slice(-8),
      tokenExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    });

    return { joinUrl, token: joinToken };
  }

  async endRoom(eventId: string, organizerId: string) {
    const event = await EventModel.findOne({ _id: eventId, organizerId });
    if (!event?.virtualSession?.roomName) throw new AppError(404, 'NOT_FOUND', 'No active room');

    // Eject all and delete room
    await deleteDailyRoom(event.virtualSession.roomName);

    const peak = event.virtualSession.peakAttendees || 0;

    await EventModel.findByIdAndUpdate(eventId, {
      'virtualSession.isLive': false,
      'virtualSession.currentAttendees': 0,
      'virtualSession.endedAt': new Date(),
      status: EventStatus.ENDED,
    });

    return { success: true, peakAttendees: peak };
  }
}
