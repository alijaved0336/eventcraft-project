import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { TicketIssuanceModel } from '../models/ticket-issuance.model';
import { UserModel } from '../models/user.model';
import { config } from '../config';

export class CheckInRepository {
  async findIssuanceByQrToken(qrToken: string, eventId: string) {
    try {
      const decoded = jwt.verify(qrToken, config.qrJwtSecret) as { tid: string; eid: string };
      
      if (decoded.eid !== eventId.toString()) {
        const error = new Error('Event mismatch');
        (error as any).code = 'EVENT_MISMATCH';
        throw error;
      }
      
      return await TicketIssuanceModel.findOne({ _id: decoded.tid, eventId })
        .populate('userId', 'name email')
        .populate('ticketTypeId', 'name')
        .populate('orderId', 'referenceNumber status');
    } catch (err: any) {
      if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
        const error = new Error('Invalid or expired token');
        (error as any).code = 'TICKET_NOT_FOUND';
        throw error;
      }
      throw err;
    }
  }

  async findIssuanceByEmail(email: string, eventId: string) {
    const user = await UserModel.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!user) return null;

    // Find the most recent valid TicketIssuance for that user+event where order status is completed.
    // We populate orderId to check status, but mongoose doesn't let us filter on populated fields 
    // easily without an aggregation or multiple queries unless we just fetch and filter.
    // Better: aggregate or find then filter.
    const issuances = await TicketIssuanceModel.find({ userId: user._id, eventId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('ticketTypeId', 'name')
      .populate('orderId', 'referenceNumber status');

    // Return the first one where order status is completed (assuming OrderModel has status)
    return issuances.find((iss: any) => iss.orderId?.status === 'completed' || iss.orderId?.status === 'CONFIRMED') || null;
  }

  async atomicCheckIn(issuanceId: string, staffUserId: string, method: 'qr' | 'manual' | 'self', location?: string) {
    return await TicketIssuanceModel.findOneAndUpdate(
      { _id: issuanceId, 'checkIn.checkedInAt': null },
      {
        $set: {
          checkedIn: true,
          'checkIn.checkedInAt': new Date(),
          'checkIn.checkedInBy': staffUserId,
          'checkIn.method': method,
          'checkIn.location': location ?? null,
        },
      },
      { new: true }
    )
    .populate('userId', 'name email')
    .populate('ticketTypeId', 'name')
    .populate('orderId', 'referenceNumber status');
  }

  async undoCheckIn(issuanceId: string) {
    return await TicketIssuanceModel.findByIdAndUpdate(
      issuanceId,
      {
        $set: {
          checkedIn: false,
          'checkIn.checkedInAt': null,
          'checkIn.checkedInBy': null,
          'checkIn.method': null,
          'checkIn.location': null,
        },
      },
      { new: true }
    );
  }

  async getAttendeeList(eventId: string, filter: any = {}, pagination: any = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      { $match: { eventId: new mongoose.Types.ObjectId(eventId), deletedAt: null } },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },
      { $match: { 'order.status': { $in: ['completed', 'CONFIRMED'] } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'tickettypes',
          localField: 'ticketTypeId',
          foreignField: '_id',
          as: 'ticketType',
        },
      },
      { $unwind: { path: '$ticketType', preserveNullAndEmptyArrays: true } },
    ];

    if (filter.checkedIn === true) {
      pipeline.push({ $match: { 'checkIn.checkedInAt': { $ne: null } } });
    } else if (filter.checkedIn === false) {
      pipeline.push({ $match: { 'checkIn.checkedInAt': null } });
    }

    if (filter.search) {
      pipeline.push({
        $match: {
          $or: [
            { 'attendeeName': { $regex: filter.search, $options: 'i' } },
            { 'attendeeEmail': { $regex: filter.search, $options: 'i' } },
            { 'user.name': { $regex: filter.search, $options: 'i' } },
            { 'user.email': { $regex: filter.search, $options: 'i' } },
          ],
        },
      });
    }

    if (filter.ticketTypeId) {
      pipeline.push({ $match: { ticketTypeId: new mongoose.Types.ObjectId(filter.ticketTypeId) } });
    }

    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    });

    const results = await TicketIssuanceModel.aggregate(pipeline);
    const data = results[0].data;
    const totalCount = results[0].total[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      attendees: data.map((d: any) => ({
        id: d._id.toString(),
        fullName: d.attendeeName || d.user.name,
        email: d.attendeeEmail || d.user.email,
        ticketType: d.ticketType ? { id: d.ticketType._id.toString(), name: d.ticketType.name } : null,
        order: { id: d.order._id.toString(), referenceNumber: d.order.referenceNumber || d.ticketNumber },
        checkIn: {
          checkedInAt: d.checkIn?.checkedInAt,
          checkedInBy: d.checkIn?.checkedInBy,
          method: d.checkIn?.method,
          location: d.checkIn?.location,
        },
      })),
      totalCount,
      pageInfo: {
        hasNextPage: page < totalPages,
        currentPage: page,
        totalPages,
      },
    };
  }

  async getCheckInStats(eventId: string) {
    const pipeline: any[] = [
      { $match: { eventId: new mongoose.Types.ObjectId(eventId), deletedAt: null } },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },
      { $match: { 'order.status': { $in: ['completed', 'CONFIRMED'] } } },
      {
        $group: {
          _id: '$ticketTypeId',
          total: { $sum: 1 },
          checkedIn: {
            $sum: { $cond: [{ $ne: ['$checkIn.checkedInAt', null] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'tickettypes',
          localField: '_id',
          foreignField: '_id',
          as: 'ticketType',
        },
      },
      { $unwind: { path: '$ticketType', preserveNullAndEmptyArrays: true } },
    ];

    const results = await TicketIssuanceModel.aggregate(pipeline);

    let total = 0;
    let checkedIn = 0;
    const byTicketType = results.map((r: any) => {
      total += r.total;
      checkedIn += r.checkedIn;
      return {
        ticketTypeName: r.ticketType?.name || 'Unknown',
        total: r.total,
        checkedIn: r.checkedIn,
        rate: r.total > 0 ? r.checkedIn / r.total : 0,
      };
    });

    return {
      total,
      checkedIn,
      notCheckedIn: total - checkedIn,
      checkInRate: total > 0 ? checkedIn / total : 0,
      byTicketType,
    };
  }
}
