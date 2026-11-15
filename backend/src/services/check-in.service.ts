import { CheckInRepository } from '../repositories/check-in.repository';
import { EventRepository } from '../repositories/event.repository';
import { EventMemberModel } from '../models/event-member.model';
import { UserRole } from '../lib/permissions';
import { TicketIssuanceModel } from '../models/ticket-issuance.model';
import { Types } from 'mongoose';

export class CheckInService {
  private repository: CheckInRepository;

  constructor() {
    this.repository = new CheckInRepository();
  }

  async checkIn(input: any, staffUserId: string) {
    if (!input.qrToken && !input.email) {
      return {
        __typename: 'CheckInError',
        code: 'TICKET_NOT_FOUND',
        message: 'Must provide either qrToken or email',
      };
    }

    let issuance: any = null;
    try {
      if ((input.method === 'qr' || input.method === 'self') && input.qrToken) {
        issuance = await this.repository.findIssuanceByQrToken(input.qrToken, input.eventId);
        
        // Authorization for self-check-in
        if (input.method === 'self' && issuance && issuance.userId?._id?.toString() !== staffUserId) {
          return {
            __typename: 'CheckInError',
            code: 'UNAUTHORIZED',
            message: 'You can only self-check-in your own ticket',
          };
        }
      } else if (input.method === 'manual' && input.email) {
        issuance = await this.repository.findIssuanceByEmail(input.email, input.eventId);
      }
    } catch (err: any) {
      if (err.code === 'EVENT_MISMATCH' || err.code === 'TICKET_NOT_FOUND') {
        return { __typename: 'CheckInError', code: err.code, message: err.message };
      }
      throw err;
    }

    if (!issuance) {
      return {
        __typename: 'CheckInError',
        code: 'TICKET_NOT_FOUND',
        message: 'No valid ticket found for check-in',
      };
    }

    const orderStatus = issuance.orderId?.status;
    const validStatuses = ['confirmed', 'completed', 'paid'];
    if (!validStatuses.includes(orderStatus)) {
      return {
        __typename: 'CheckInError',
        code: 'TICKET_INVALID',
        message: `Ticket belongs to a ${orderStatus || 'unknown'} order`,
      };
    }

    const updated = await this.repository.atomicCheckIn(
      issuance._id.toString(),
      staffUserId,
      input.method,
      input.location
    );

    if (!updated) {
      // Find the existing checkedIn time from the issuance we already pulled
      const time = (issuance.checkIn as any)?.checkedInAt?.toISOString() || 'an unknown time';
      return {
        __typename: 'CheckInError',
        code: 'ALREADY_CHECKED_IN',
        message: `Already checked in at ${time}`,
      };
    }

    return {
      __typename: 'CheckInSuccess',
      ticketIssuance: updated,
      attendee: {
        id: (updated.userId as any)?._id?.toString() || updated.userId?.toString(),
        fullName: updated.attendeeName || (updated.userId as any)?.name,
        email: updated.attendeeEmail || (updated.userId as any)?.email,
        ticketType: updated.ticketTypeId,
        order: updated.orderId,
        checkIn: updated.checkIn,
      },
    };
  }

  async checkInManual(issuanceId: string, staffUserId: string) {
    const issuance = await TicketIssuanceModel.findById(issuanceId).populate('orderId');
    if (!issuance) {
      return {
        __typename: 'CheckInError',
        code: 'TICKET_NOT_FOUND',
        message: 'No valid ticket found for check-in',
      };
    }

    const orderStatus = (issuance.orderId as any)?.status;
    const validStatuses = ['confirmed', 'completed', 'paid'];
    if (!validStatuses.includes(orderStatus)) {
      return {
        __typename: 'CheckInError',
        code: 'TICKET_INVALID',
        message: `Ticket belongs to a ${orderStatus || 'unknown'} order`,
      };
    }

    const updated = await this.repository.atomicCheckIn(issuanceId, staffUserId, 'manual');

    if (!updated) {
      const time = (issuance.checkIn as any)?.checkedInAt?.toISOString() || 'an unknown time';
      return {
        __typename: 'CheckInError',
        code: 'ALREADY_CHECKED_IN',
        message: `Already checked in at ${time}`,
      };
    }

    return {
      __typename: 'CheckInSuccess',
      ticketIssuance: updated,
      attendee: {
        id: (updated.userId as any)?._id?.toString() || updated.userId?.toString(),
        fullName: updated.attendeeName || (updated.userId as any)?.name,
        email: updated.attendeeEmail || (updated.userId as any)?.email,
        ticketType: updated.ticketTypeId,
        order: updated.orderId,
        checkIn: updated.checkIn,
      },
    };
  }

  async undoCheckIn(ticketIssuanceId: string, requestingUserId: string, requestingUserRole: UserRole) {
    // 1. Fetch issuance
    const issuance = await TicketIssuanceModel.findById(ticketIssuanceId).populate('eventId');
    if (!issuance) throw new Error('Issuance not found');

    // 2. Authorize
    await this.authorizeEventAccess(issuance.eventId._id.toString(), requestingUserId, requestingUserRole);

    // 3. Grace window validation (5 minutes)
    if (!issuance.checkedIn || !issuance.checkIn?.checkedInAt) {
      throw new Error('Ticket is not checked in');
    }

    return await this.repository.undoCheckIn(ticketIssuanceId);
  }

  private async authorizeEventAccess(eventId: string, requestingUserId: string, requestingUserRole: UserRole) {
    if ([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SYSTEM].includes(requestingUserRole)) {
      return true;
    }

    const event = await EventRepository.findById(eventId);
    if (!event) throw new Error('Event not found');

    const organizerId = (event.organizerId as any)?._id?.toString() || event.organizerId?.toString() || '';
    if (organizerId && organizerId === requestingUserId) {
      return true;
    }

    const isStaff = await EventMemberModel.exists({ eventId, userId: requestingUserId });
    if (isStaff) {
      return true;
    }

    throw new Error('Unauthorized');
  }

  async getAttendeeList(eventId: string, requestingUserId: string, requestingUserRole: UserRole, filter: any = {}, pagination: any = {}) {
    await this.authorizeEventAccess(eventId, requestingUserId, requestingUserRole);
    return await this.repository.getAttendeeList(eventId, filter, pagination);
  }

  async getCheckInStats(eventId: string, requestingUserId: string, requestingUserRole: UserRole) {
    await this.authorizeEventAccess(eventId, requestingUserId, requestingUserRole);
    return await this.repository.getCheckInStats(eventId);
  }
}
