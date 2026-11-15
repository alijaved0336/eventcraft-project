import { GraphQLError } from 'graphql';
import { OrderService } from '../../services/order.service';
import { EventService } from '../../services/event.service';
import type { ApolloContext } from '../context';
import { TicketIssuanceRepository } from '../../repositories/ticket-issuance.repository';

const orderService = new OrderService();
const ticketIssuanceRepository = new TicketIssuanceRepository();

export const orderResolvers = {
  Query: {
    getOrder: async (_parent: unknown, { orderId }: { orderId: string }, context: ApolloContext) => {
      // Basic auth check
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 },
        });
      }
      return await orderService.getOrder(orderId);
    },
    getMyOrders: async (_parent: unknown, { eventId }: { eventId?: string }, context: ApolloContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 },
        });
      }
      return await orderService.getMyOrders(context.user.userId, eventId);
    },
  },
  Mutation: {
    createOrder: async (_parent: unknown, { input }: { input: any }, context: ApolloContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 },
        });
      }
      const { eventId, items, promoCode } = input;
      return await orderService.createOrder(context.user.userId, eventId, items, promoCode);
    },
    cancelOrder: async (_parent: unknown, { orderId }: { orderId: string }, context: ApolloContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 },
        });
      }
      // We'll use failOrder for cancellation from user
      const order = await orderService.getOrder(orderId);
      if (!order) throw new Error('Order not found');
      if (order.userId.toString() !== context.user.userId) {
        throw new GraphQLError('Access Denied', {
          extensions: { code: 'FORBIDDEN', httpStatus: 403 },
        });
      }
      
      await orderService.failOrder(orderId, 'Cancelled by user');
      return await orderService.getOrder(orderId);
    },
  },
  Order: {
    tickets: async (parent: any) => {
      const id = parent.id || parent._id;
      return await ticketIssuanceRepository.findByOrder(id.toString());
    },
    event: async (parent: any, _args: unknown, context: ApolloContext) => {
      const eventId = parent.eventId.toString();
      return await EventService.getEventDetails(eventId, context.user ?? undefined);
    },
  },
};
