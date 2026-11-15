import { Types } from 'mongoose';
import { TicketIssuanceModel } from '../../models/ticket-issuance.model';
import { UserModel } from '../../models/user.model';
import { NotFoundError, ValidationError, ForbiddenError } from '../../errors';
import { logger } from '../../lib/logger';

export class AssignmentService {
  async assignTicket(
    issuanceId: string,
    input: { name?: string; email?: string; userId?: string },
    requestingUserId: string
  ) {
    const issuance = await TicketIssuanceModel.findOne({ _id: issuanceId, deletedAt: null });
    if (!issuance) {
      throw new NotFoundError('Ticket issuance not found');
    }

    // Ownership check: only buyer can assign
    if (issuance.userId.toString() !== requestingUserId) {
      throw new ForbiddenError('Only the purchaser can assign this ticket');
    }

    // Status check: cannot reassign checked-in or cancelled seat
    if (issuance.checkedIn) {
      throw new ValidationError('Cannot reassign a checked-in ticket');
    }
    const statusStr = issuance.status as string;
    if (statusStr === 'cancelled' || statusStr === 'refunded') {
      throw new ValidationError('Cannot reassign a cancelled or refunded ticket');
    }

    let assignedTo: any = {
      assignedAt: new Date(),
    };

    if (input.userId) {
      const user = await UserModel.findById(input.userId);
      if (!user) throw new NotFoundError('Assigned user not found');
      assignedTo.userId = user._id;
      assignedTo.name = user.name;
      assignedTo.email = user.email;
    } else if (input.email) {
      // Check for duplicate guest assignment for the same event and ticket type
      const existing = await TicketIssuanceModel.findOne({
        eventId: issuance.eventId,
        ticketTypeId: issuance.ticketTypeId,
        'assignedTo.email': input.email.toLowerCase(),
        status: { $nin: ['cancelled', 'refunded'] },
        deletedAt: null,
        _id: { $ne: issuanceId },
      });

      if (existing) {
        throw new ValidationError('This guest is already assigned to a ticket of this type for this event');
      }

      assignedTo.userId = null;
      assignedTo.name = input.name || 'Guest';
      assignedTo.email = input.email.toLowerCase();
    } else {
      throw new ValidationError('Must provide either userId or email for assignment');
    }

    const updated = await TicketIssuanceModel.findOneAndUpdate(
      { _id: issuanceId },
      { $set: { assignedTo } },
      { new: true }
    );

    if (!updated) throw new Error('Failed to update assignment');

    // Assignment notification removed (Redis-free migration)
    logger.info(`Ticket ${updated._id} assigned to ${updated.assignedTo?.email || updated.assignedTo?.userId}`);

    return updated;
  }

  async reassignTicket(
    issuanceId: string,
    input: { name?: string; email?: string; userId?: string },
    requestingUserId: string
  ) {
    const issuance = await TicketIssuanceModel.findOne({ _id: issuanceId, deletedAt: null });
    if (!issuance) throw new NotFoundError('Ticket issuance not found');

    const previousAssignee = issuance.assignedTo;

    const updated = await this.assignTicket(issuanceId, input, requestingUserId);

    if (previousAssignee?.userId) {
      // Assignment revoked notification removed (Redis-free migration)
      logger.info(`Ticket ${updated._id} reassigned. Previous assignee: ${previousAssignee.userId}`);
    }

    return updated;
  }

  async revokeAssignment(issuanceId: string, requestingUserId: string) {
    const issuance = await TicketIssuanceModel.findOne({ _id: issuanceId, deletedAt: null });
    if (!issuance) throw new NotFoundError('Ticket issuance not found');

    if (issuance.userId.toString() !== requestingUserId) {
      throw new ForbiddenError('Only the purchaser can revoke assignment');
    }

    if (issuance.checkedIn) {
      throw new ValidationError('Cannot revoke assignment of a checked-in ticket');
    }

    const previousAssignee = issuance.assignedTo;

    const updated = await TicketIssuanceModel.findOneAndUpdate(
      { _id: issuanceId },
      { $set: { assignedTo: null } },
      { new: true }
    );

    if (previousAssignee?.userId) {
      // Assignment revoked notification removed (Redis-free migration)
      logger.info(`Assignment revoked for ticket ${issuanceId}. Previous assignee: ${previousAssignee.userId}`);
    }

    return updated;
  }
}
