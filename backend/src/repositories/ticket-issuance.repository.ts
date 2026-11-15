import { TicketIssuanceModel, ITicketIssuanceDocument, TicketIssuanceStatus } from '../models/ticket-issuance.model';
import { Types } from 'mongoose';

export class TicketIssuanceRepository {
  async createMany(data: Partial<ITicketIssuanceDocument>[]): Promise<ITicketIssuanceDocument[]> {
    return (await TicketIssuanceModel.insertMany(data)) as any;
  }

  async findByOrder(orderId: string | Types.ObjectId): Promise<ITicketIssuanceDocument[]> {
    return await TicketIssuanceModel.find({ orderId });
  }

  async findByQrToken(qrToken: string): Promise<ITicketIssuanceDocument | null> {
    return await TicketIssuanceModel.findOne({ qrToken, deletedAt: null })
      .populate('userId', 'name email avatar')
      .populate('ticketTypeId', 'name')
      .populate('eventId', 'title startDate endDate');
  }

  async findById(id: string | Types.ObjectId): Promise<ITicketIssuanceDocument | null> {
    return await TicketIssuanceModel.findById(id).populate('eventId');
  }

  async findByEvent(
    eventId: string | Types.ObjectId,
    filters: { page?: number; limit?: number; ticketTypeId?: string; status?: string; checkedIn?: boolean } = {}
  ): Promise<ITicketIssuanceDocument[]> {
    const { page = 1, limit = 50, ticketTypeId, status, checkedIn } = filters;
    const query: Record<string, any> = { eventId, deletedAt: null };

    if (ticketTypeId) query.ticketTypeId = ticketTypeId;
    if (status) query.status = status;
    if (checkedIn !== undefined) {
      query['checkIn.checkedInAt'] = checkedIn ? { $ne: null } : null;
    }

    return await TicketIssuanceModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name email avatar')
      .populate('ticketTypeId', 'name')
      .lean();
  }

  async countByEvent(
    eventId: string | Types.ObjectId,
    filters: { ticketTypeId?: string; status?: string; checkedIn?: boolean } = {}
  ): Promise<number> {
    const { ticketTypeId, status, checkedIn } = filters;
    const query: Record<string, any> = { eventId, deletedAt: null };

    if (ticketTypeId) query.ticketTypeId = ticketTypeId;
    if (status) query.status = status;
    if (checkedIn !== undefined) {
      query['checkIn.checkedInAt'] = checkedIn ? { $ne: null } : null;
    }

    return await TicketIssuanceModel.countDocuments(query);
  }

  async checkIn(
    qrToken: string,
    staffId: string | Types.ObjectId,
    method: string,
    meta: any = {}
  ): Promise<ITicketIssuanceDocument | null> {
    const now = new Date();
    return await TicketIssuanceModel.findOneAndUpdate(
      {
        qrToken,
        status: TicketIssuanceStatus.ACTIVE,
        deletedAt: null,
      },
      {
        $set: {
          status: TicketIssuanceStatus.CHECKED_IN,
          'checkIn.checkedInAt': now,
          'checkIn.checkedInBy': staffId,
          'checkIn.method': method,
          'checkIn.deviceInfo': meta.deviceInfo || null,
          'checkIn.location': meta.location || null,
        },
      },
      { new: true }
    )
      .populate('userId', 'name email')
      .populate('ticketTypeId');
  }

  async undoCheckIn(id: string | Types.ObjectId): Promise<ITicketIssuanceDocument | null> {
    return await TicketIssuanceModel.findOneAndUpdate(
      { _id: id, status: TicketIssuanceStatus.CHECKED_IN, deletedAt: null },
      {
        $set: {
          status: TicketIssuanceStatus.ACTIVE,
          'checkIn.checkedInAt': null,
          'checkIn.checkedInBy': null,
          'checkIn.method': null,
        },
      },
      { new: true }
    );
  }

  async getCheckInStats(eventId: string | Types.ObjectId): Promise<any> {
    return await TicketIssuanceModel.aggregate([
      { $match: { eventId: new Types.ObjectId(eventId.toString()), deletedAt: null } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
  }
}
