import { GraphQLError } from 'graphql';
import { EventModel, type IEventDocument } from '../../models/event.model';
import { TicketIssuanceModel } from '../../models/ticket-issuance.model';
import { createDailyToken, deleteDailyRoom } from '../../services/integrations/daily.service';
import { logger } from '../../lib/logger';
import type { ApolloContext } from '../context';
import { RoomService } from '../../services/attendance/room.service';

// Service helper to avoid global state leakage
const getRoomService = () => new RoomService();

export const livestreamResolvers = {
  Event: {
    virtualSession: (parent: IEventDocument) => {
      if (!parent.virtualSession) return null;
      // Inject parent context for the VirtualSession field resolvers safely
      const sessionObj =
        typeof (parent.virtualSession as any).toObject === 'function'
          ? (parent.virtualSession as any).toObject()
          : parent.virtualSession;

      const organizerId =
        (parent.organizerId as any)?._id?.toString() || (parent.organizerId as any)?.toString();

      return {
        ...sessionObj,
        eventId: parent._id.toString(),
        organizerId: organizerId,
      };
    },
  },

  VirtualSession: {
    id: (parent: { id?: string; _id?: any }) => parent.id || parent._id?.toString(),
    hostUrl: async (
      parent: { roomName: string; hostUrl: string; organizerId: string },
      _: unknown,
      context: ApolloContext,
    ) => {
      if (!parent.hostUrl) return null;
      if (parent.hostUrl.includes('?t=')) return parent.hostUrl;

      // Dynamic host token generation: only for the organizer
      if (context.user?.userId && context.user.userId === parent.organizerId) {
        try {
          const tokenData = await createDailyToken(parent.roomName, {
            isOwner: true,
            expiryHours: 24,
            userId: context.user.userId,
            userName: (context.user as any).email || 'Organizer',
          });
          return `${parent.hostUrl}?t=${tokenData.token}`;
        } catch (err) {
          logger.error('Failed to generate dynamic host token', { error: err });
          return parent.hostUrl; // fallback to clean URL
        }
      }
      return null; // Don't return hostUrl to non-organizers
    },
  },

  Query: {
    getJoinToken: async (_: unknown, { eventId }: { eventId: string }, context: ApolloContext) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const event = await EventModel.findById(eventId);
      if (!event) {
        throw new GraphQLError('Event not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // 1. Verify access: User must have a ticket (either as purchaser or assigned recipient)
      const ticket = await TicketIssuanceModel.findOne({
        eventId: event._id,
        $or: [{ userId: context.user.userId }, { 'assignedTo.userId': context.user.userId }],
        status: { $ne: 'cancelled' },
      });

      const organizerId =
        (event.organizerId as unknown as { _id?: string; toString: () => string })?._id?.toString() ||
        event.organizerId?.toString();
      const isOrganizer = organizerId === context.user.userId;

      if (!ticket && !isOrganizer) {
        throw new GraphQLError('Forbidden: Valid ticket required.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (!ticket) {
        throw new GraphQLError('Ticket not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // 2. Ensure room has been created by organizer
      if (!event.virtualSession?.roomName) {
        throw new GraphQLError('Virtual session has not been initialized by the organizer yet.', {
          extensions: { code: 'PRECONDITION_FAILED' },
        });
      }

      // 3. Issue the attendee token via service
      try {
        const tokenData = await getRoomService().issueAttendeeToken(
          eventId,
          ticket._id.toString(),
          { id: context.user.userId, email: (context.user as any).email }
        );

        const tokenString = tokenData.token;
        
        if (!tokenString) throw new Error('Token generation failed');
        return tokenString;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        throw new GraphQLError(`Access Error: ${message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  Mutation: {
    connectVirtualRoom: async (
      _: unknown,
      { eventId, force }: { eventId: string; force?: boolean },
      context: ApolloContext,
    ) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Use the hardened service to provision/re-provision
      const session = await getRoomService().createEventRoom(
        eventId,
        { id: context.user.userId, email: context.user.email },
        force ?? true, // Connect always intends to (re)initialize
      );

      return {
        ...session,
        eventId,
        organizerId: context.user.userId,
      };
    },

    toggleLivestream: async (
      _: unknown,
      { eventId, isLive }: { eventId: string; isLive: boolean },
      context: ApolloContext,
    ) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const event = (await EventModel.findById(eventId)) as IEventDocument | null;
      if (!event) {
        throw new GraphQLError('Event not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const organizerId =
        (event.organizerId as any)?._id?.toString() || event.organizerId?.toString();
      if (organizerId !== context.user.userId) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (!event.virtualSession) {
        throw new GraphQLError('No virtual session connected', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      event.virtualSession.isLive = isLive;
      if (!isLive) {
        event.virtualSession.endedAt = new Date();
      }

      await event.save();

      const sessionObj =
        typeof (event.virtualSession as any).toObject === 'function'
          ? (event.virtualSession as any).toObject()
          : event.virtualSession;

      // Return with injected context
      return {
        ...sessionObj,
        eventId: event._id.toString(),
        organizerId: organizerId,
      };
    },

    endVirtualSession: async (_: unknown, { eventId }: { eventId: string }, context: ApolloContext) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const event = await EventModel.findById(eventId);
      if (!event) {
        throw new GraphQLError('Event not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const organizerId =
        (event.organizerId as any)?._id?.toString() || event.organizerId?.toString();
      if (organizerId !== context.user.userId) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (!event.virtualSession) return true;

      try {
        await deleteDailyRoom(event.virtualSession.roomName);
        event.virtualSession.endedAt = new Date();
        event.virtualSession.isLive = false;
        await event.save();
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('Failed to end virtual session', { eventId, error: message });
        return false; // Soft fail on deletion error
      }
    },
  },
};
