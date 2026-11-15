import { GraphQLError } from 'graphql';
import mongoose from 'mongoose';
import { CheckInService } from '../../services/check-in.service';
import { TicketIssuanceService } from '../../services/ticket-issuance.service';
import { TicketIssuanceModel } from '../../models/ticket-issuance.model';
import { AssignmentService } from '../../services/attendance/assignment.service';
import { AttendeeQueryService } from '../../services/attendance/attendee.query.service';
import type { ApolloContext } from '../context';

const checkInService = new CheckInService();
const ticketIssuanceService = new TicketIssuanceService();
const assignmentService = new AssignmentService();
const attendeeQueryService = new AttendeeQueryService();

// Re-using common logic for ID extraction
const getUserId = (context: ApolloContext): string => {
  if (!context.user) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 },
    });
  }
  return context.user.userId;
};

interface CheckInInput {
  eventId: string;
  qrToken?: string;
  email?: string;
  method: 'qr' | 'manual' | 'self';
  location?: string;
}

interface AssignmentInput {
  name?: string;
  email?: string;
  userId?: string;
}

interface AttendeeListArgs {
  eventId: string;
  filter?: any;
  pagination?: any;
}

export const attendanceResolvers = {
  CheckInResult: {
    __resolveType(obj: { __typename?: string; code?: string; message?: string }) {
      if (obj.__typename) return obj.__typename;
      if (obj.code && obj.message) return 'CheckInError';
      return 'CheckInSuccess';
    },
  },

  AssignedTo: {
    isGuest: (parent: { email?: string; userId?: string }) => !!parent?.email && !parent?.userId,
    isUnassigned: (parent: { email?: string; userId?: string } | null) => !parent,
  },

  AttendeeRecord: {
    issuanceId: (parent: { issuanceId?: string; _id?: mongoose.Types.ObjectId }) => parent.issuanceId || parent._id?.toString(),
    fullName: (parent: { fullName?: string; attendee?: { name?: string } }) => parent.fullName || parent.attendee?.name,
    status: (parent: { status?: string }) => parent.status || 'active',
    checkedIn: (parent: { checkedIn?: boolean }) => !!parent.checkedIn,
  },

  IssuanceStatus: {
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    TRANSFERRED: 'transferred',
  },
  
  Mutation: {
    checkInAttendee: async (_: unknown, { input }: { input: CheckInInput }, context: ApolloContext) => {
      const userId = getUserId(context);
      return await checkInService.checkIn(input, userId);
    },

    undoCheckIn: async (_: unknown, { ticketIssuanceId }: { ticketIssuanceId: string }, context: ApolloContext) => {
      const userId = getUserId(context);
      const updated = await checkInService.undoCheckIn(ticketIssuanceId, userId, context.user!.role);
      if (!updated) {
        throw new GraphQLError('Failed to undo check in', { extensions: { code: 'NOT_FOUND' } });
      }
      return updated;
    },

    assignTicket: async (_: unknown, { issuanceId, input }: { issuanceId: string; input: AssignmentInput }, context: ApolloContext) => {
      const userId = getUserId(context);
      return await assignmentService.assignTicket(issuanceId, input, userId);
    },

    reassignTicket: async (_: unknown, { issuanceId, input }: { issuanceId: string; input: AssignmentInput }, context: ApolloContext) => {
      const userId = getUserId(context);
      return await assignmentService.reassignTicket(issuanceId, input, userId);
    },

    revokeAssignment: async (_: unknown, { issuanceId }: { issuanceId: string }, context: ApolloContext) => {
      const userId = getUserId(context);
      return await assignmentService.revokeAssignment(issuanceId, userId);
    },

    checkInManual: async (_: unknown, { issuanceId }: { issuanceId: string }, context: ApolloContext) => {
      const userId = getUserId(context);
      return await checkInService.checkInManual(issuanceId, userId);
    },
  },

  Query: {
    attendeeList: async (_: unknown, { eventId, filter, pagination }: AttendeeListArgs, context: ApolloContext) => {
      const userId = getUserId(context);
      return await checkInService.getAttendeeList(eventId, userId, context.user!.role, filter || {}, pagination || {});
    },

    checkInStats: async (_: unknown, { eventId }: { eventId: string }, context: ApolloContext) => {
      const userId = getUserId(context);
      return await checkInService.getCheckInStats(eventId, userId, context.user!.role);
    },

    myTicket: async (_: unknown, { issuanceId }: { issuanceId: string }, context: ApolloContext) => {
      const userId = getUserId(context);
      return await TicketIssuanceModel.findOne({ _id: issuanceId, userId, deletedAt: null })
        .populate('ticketTypeId')
        .populate('orderId')
        .populate('eventId');
    },

    myTickets: async (_: unknown, __: unknown, context: ApolloContext) => {
      const userId = getUserId(context);
      const tickets = await attendeeQueryService.getMyTickets(userId);
      // Force boolean coercion for non-nullable schema compatibility
      return (tickets || []).map((t: any) => ({
        ...t,
        checkedIn: !!t.checkedIn,
        issuanceId: t.issuanceId || t._id?.toString() || '',
      }));
    },

    listAttendeesForEvent: async (_: unknown, { eventId, filters, page, limit }: { 
      eventId: string; 
      filters?: any; 
      page?: number; 
      limit?: number; 
    }, context: ApolloContext) => {
      getUserId(context); // Authorization check
      return await attendeeQueryService.listAttendeesForEvent(eventId, filters || {}, { page: page || 1, limit: limit || 20 });
    },

    getAttendanceStats: async (_: unknown, { eventId }: { eventId: string }, context: ApolloContext) => {
      getUserId(context); // Authorization check
      return await attendeeQueryService.getAttendanceStats(eventId);
    },
  },

  MyTicketIssuance: {
    issuanceId: (parent: { issuanceId?: string; _id?: mongoose.Types.ObjectId }) => parent.issuanceId || parent._id?.toString() || '',
    checkedIn: (parent: { checkedIn?: boolean }) => !!parent.checkedIn,
  },

  TicketIssuance: {
    qrCode: async (parent: { qrToken?: string }) => {
      if (!parent.qrToken) return null;
      return await ticketIssuanceService.generateQrCode(parent.qrToken);
    },
    ticketTypeName: async (parent: { ticketType?: { name: string }; ticketTypeId?: mongoose.Types.ObjectId }) => {
      if (parent.ticketType?.name) return parent.ticketType.name;
      if (parent.ticketTypeId) {
        const TicketType = mongoose.model('TicketType');
        const tt = await TicketType.findById(parent.ticketTypeId).select('name');
        return tt?.name;
      }
      return null;
    },
    event: async (parent: { eventId?: mongoose.Types.ObjectId; event?: any }) => {
      if (parent.eventId && !parent.event) {
        return await mongoose.model('Event').findById(parent.eventId);
      }
      return parent.event;
    },
    ticketType: async (parent: { ticketTypeId?: mongoose.Types.ObjectId; ticketType?: any }) => {
      if (parent.ticketTypeId && !parent.ticketType) {
        return await mongoose.model('TicketType').findById(parent.ticketTypeId);
      }
      return parent.ticketType;
    },
    order: async (parent: { orderId?: mongoose.Types.ObjectId; order?: any }) => {
      if (parent.orderId && !parent.order) {
        return await mongoose.model('Order').findById(parent.orderId);
      }
      return parent.order;
    },
    checkedIn: (parent: { checkedIn?: boolean }) => !!parent.checkedIn,
  },
};
