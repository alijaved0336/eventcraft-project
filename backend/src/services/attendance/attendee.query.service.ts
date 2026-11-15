import mongoose, { Types } from 'mongoose';
import { TicketIssuanceModel } from '../../models/ticket-issuance.model';

interface AttendeeFilters { 
  status?: 'ALL' | 'CHECKED_IN' | 'NOT_ARRIVED' | 'UNASSIGNED';
  checkedIn?: boolean; 
  unassigned?: boolean; 
  ticketTypeId?: string; 
  search?: string; 
}

interface Pagination { 
  page: number; 
  limit: number; 
}

export class AttendeeQueryService {
  async listAttendeesForEvent(
    eventId: string,
    filters: AttendeeFilters,
    pagination: Pagination
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const match: Record<string, any> = {
      eventId: new Types.ObjectId(eventId),
      deletedAt: null,
      status: { $nin: ['cancelled', 'refunded'] },
    };

    if (filters.status) {
      if (filters.status === 'CHECKED_IN') {
        match.checkedIn = true;
      } else if (filters.status === 'NOT_ARRIVED') {
        match.checkedIn = false;
      } else if (filters.status === 'UNASSIGNED') {
        match.assignedTo = null;
      }
    }

    if (filters.checkedIn !== undefined) {
      match.checkedIn = filters.checkedIn;
    }

    if (filters.unassigned === true) {
      match.assignedTo = null;
    }

    if (filters.ticketTypeId) {
      match.ticketTypeId = new Types.ObjectId(filters.ticketTypeId);
    }

    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
      // Lookup purchaser
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'purchaser',
        },
      },
      { $unwind: '$purchaser' },
      // Lookup attendee (if registered)
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo.userId',
          foreignField: '_id',
          as: 'resolvedUser',
        },
      },
      { $unwind: { path: '$resolvedUser', preserveNullAndEmptyArrays: true } },
      // Lookup ticket type
      {
        $lookup: {
          from: 'tickettypes',
          localField: 'ticketTypeId',
          foreignField: '_id',
          as: 'ticketTypeDoc',
        },
      },
      { $unwind: '$ticketTypeDoc' },
    ];

    // Search filter
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'resolvedUser.name': searchRegex },
            { 'resolvedUser.email': searchRegex },
            { 'assignedTo.name': searchRegex },
            { 'assignedTo.email': searchRegex },
            { 'purchaser.name': searchRegex },
            { 'purchaser.email': searchRegex },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              issuanceId: '$_id',
              ticketType: {
                id: '$ticketTypeDoc._id',
                name: '$ticketTypeDoc.name',
              },
              checkedIn: { $ifNull: ['$checkedIn', false] },
              checkedInAt: '$checkIn.checkedInAt',
              checkInMethod: '$checkIn.method',
              status: 1,
              purchaser: {
                name: '$purchaser.name',
                email: '$purchaser.email',
              },
              attendee: {
                userId: '$assignedTo.userId',
                name: { $ifNull: ['$resolvedUser.name', { $ifNull: ['$assignedTo.name', 'Unassigned'] }] },
                email: { $ifNull: ['$resolvedUser.email', '$assignedTo.email'] },
                assignedAt: '$assignedTo.assignedAt',
                isGuest: { $and: [{ $ne: ['$assignedTo', null] }, { $eq: ['$assignedTo.userId', null] }] },
                isUnassigned: { $eq: ['$assignedTo', null] },
              },
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    });

    const results = await TicketIssuanceModel.aggregate(pipeline);
    const data = results[0].data;
    const totalCount = results[0].total[0]?.count || 0;

    return {
      attendees: data,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async getAttendanceStats(eventId: string) {
    const eventObjectId = new Types.ObjectId(eventId);
    const baseMatch = { eventId: eventObjectId, deletedAt: null, status: { $nin: ['cancelled', 'refunded'] } };

    // Group by ticket type
    const byTicketType = await TicketIssuanceModel.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: '$ticketTypeId',
          total: { $sum: 1 },
          checkedIn: { $sum: { $cond: ['$checkedIn', 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'tickettypes',
          localField: '_id',
          foreignField: '_id',
          as: 'tt',
        },
      },
      { $unwind: '$tt' },
      {
        $project: {
          ticketTypeId: '$_id',
          name: '$tt.name',
          total: 1,
          checkedIn: 1,
        },
      },
    ]);

    // Timeline in 15-min buckets
    const checkInTimeline = await TicketIssuanceModel.aggregate([
      { $match: { ...baseMatch, checkedIn: true, 'checkIn.checkedInAt': { $ne: null } } },
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: '$checkIn.checkedInAt' },
                { $mod: [{ $toLong: '$checkIn.checkedInAt' }, 15 * 60 * 1000] },
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          bucket: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Overall stats
    const stats = await TicketIssuanceModel.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          checkedIn: { $sum: { $cond: ['$checkedIn', 1, 0] } },
          unassigned: { $sum: { $cond: [{ $eq: ['$assignedTo', null] }, 1, 0] } },
        },
      },
    ]);

    const s = stats[0] || { total: 0, checkedIn: 0, unassigned: 0 };

    return {
      total: s.total,
      checkedIn: s.checkedIn,
      notArrived: s.total - s.checkedIn,
      unassigned: s.unassigned,
      byTicketType,
      checkInTimeline,
    };
  }

  async getMyTickets(userId: string) {
    return await TicketIssuanceModel.aggregate([
      { 
        $match: { 
          $or: [
            { userId: new Types.ObjectId(userId) },
            { 'assignedTo.userId': new Types.ObjectId(userId) }
          ],
          deletedAt: null 
        } 
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'events',
          localField: 'eventId',
          foreignField: '_id',
          as: 'event',
        },
      },
      { $unwind: '$event' },
      {
        $lookup: {
          from: 'tickettypes',
          localField: 'ticketTypeId',
          foreignField: '_id',
          as: 'ticketType',
        },
      },
      { $unwind: '$ticketType' },
      {
        $project: {
          issuanceId: '$_id',
          event: {
            id: '$event._id',
            title: '$event.title',
            type: '$event.type',
            startDate: '$event.startDate',
            endDate: '$event.endDate',
            location: '$event.location',
          },
          ticketType: {
            id: '$ticketType._id',
            name: '$ticketType.name',
          },
          assignedTo: 1,
          checkedIn: { $ifNull: ['$checkedIn', false] },
          checkedInAt: '$checkIn.checkedInAt',
        },
      },
    ] as mongoose.PipelineStage[]);
  }
}
