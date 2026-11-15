import { GraphQLError } from 'graphql';
import { EventService } from '../../services/event.service';
import { CreateEventInputSchema, UpdateEventInputSchema } from '../../validators/event.validator';
import type { ApolloContext } from '../../graphql/context';
import type { IEventDocument } from '../../models/event.model';

export const eventResolvers = {
  Event: {
    id: (parent: IEventDocument) => parent.id ?? parent._id?.toString(),
    organizerId: (parent: IEventDocument, _: unknown, { loaders }: ApolloContext) => {
      const organizer: any = parent.organizerId;
      const id = organizer?._id 
        ? organizer._id.toString() 
        : organizer?.toString();
      
      if (!id) return null;
      return loaders.user.load(id);
    },
    isOwner: (parent: IEventDocument, _: unknown, ctx: ApolloContext) => {
      if (!ctx.user || !parent.organizerId) return false;
      const organizer: any = parent.organizerId;
      const idStr = organizer._id ? organizer._id.toString() : organizer.toString();
      return idStr === ctx.user.userId;
    },
  },

  Query: {
    getEvents: async (_: unknown, __: unknown, ctx: ApolloContext) => {
      // Future: parse query params for filtering/pagination
      return await EventService.getEvents({}, ctx.user as any);
    },
    discoverEvents: async (_: unknown, args: any) => {
      return await EventService.discoverEvents(
        args.query,
        args.lat,
        args.lng,
        args.radiusInMeters,
        args.date,
        args.limit,
        args.offset
      );
    },
    autocompleteEvents: async (_: unknown, { query, limit }: { query: string; limit?: number }) => {
      return await EventService.autocompleteEvents(query, limit);
    },
    featuredEvents: async () => {
      return await EventService.getFeaturedEvents(6);
    },
    getEvent: async (_: unknown, { idOrSlug }: { idOrSlug: string }, ctx: ApolloContext) => {
      return await EventService.getEventDetails(idOrSlug, ctx.user as any);
    },
    event: async (_: unknown, { id }: { id: string }, ctx: ApolloContext) => {
      return await EventService.getEventDetails(id, ctx.user as any);
    },
    ticketTypes: async (_: unknown, { eventId }: { eventId: string }) => {
      return await EventService.getTicketTypes(eventId);
    },
  },

  Mutation: {
    createEvent: async (_: any, { input }: { input: any }, ctx: ApolloContext) => {
      if (!ctx.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 },
        });
      }
      const validated = CreateEventInputSchema.parse(input);
      return await EventService.createEvent(validated, ctx.user.userId, ctx.user.role);
    },
    updateEvent: async (_: any, { id, input }: { id: string; input: any }, ctx: ApolloContext) => {
      if (!ctx.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 },
        });
      }
      const validated = UpdateEventInputSchema.parse(input);
      return await EventService.updateEvent(id, validated, ctx.user.userId, ctx.user.role);
    },
    deleteEvent: async (_: any, { id }: { id: string }, ctx: ApolloContext) => {
      if (!ctx.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 },
        });
      }
      await EventService.deleteEvent(id, ctx.user.userId, ctx.user.role);
      return true;
    },
    publishEvent: async (_: any, { id }: { id: string }, ctx: ApolloContext) => {
      if (!ctx.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 },
        });
      }
      return await EventService.publishEvent(id, ctx.user.userId, ctx.user.role);
    },
  },
};
