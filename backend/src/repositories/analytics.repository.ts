import mongoose, { Types } from 'mongoose';
import { EventModel, EventStatus } from '../models/event.model';
import { OrderModel, OrderStatus } from '../models/order.model';
import { TicketIssuanceModel, TicketIssuanceStatus } from '../models/ticket-issuance.model';

const SORT_FIELD_MAP: Record<string, string> = {
  START_DATE: 'startDate',
  TITLE: 'title',
  GROSS_REVENUE: 'grossRevenue',
  TICKETS_SOLD: 'ticketsSold',
  FILL_RATE: 'fillRate',
};

export interface AdminAnalyticsInput {
  dateRange?: { from?: string; to?: string };
  statuses?: string[];
  organizerId?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  first?: number;
  after?: string;
}

export class AnalyticsRepository {
  /**
   * Heavy aggregation to get per-event metrics for the admin table.
   */
  static async getAdminEventAnalytics(input: AdminAnalyticsInput) {
    const { dateRange, statuses, organizerId, sortBy, sortOrder, first = 10, after } = input;
    
    // Pagination skip logic (simple offset-based for now as it's an admin table)
    const skip = after ? parseInt(Buffer.from(after, 'base64').toString().split(':')[1] || '0', 10) : 0;
    const limit = first;

    const matchStage: any = { deletedAt: null };
    if (statuses?.length) matchStage.status = { $in: statuses.map((s: string) => s.toLowerCase()) };
    if (organizerId) matchStage.organizerId = new Types.ObjectId(organizerId);
    
    // We no longer filter events by startDate here, so all active events show up.
    // Instead, we scope the individual metrics (sales, revenue) to the dateRange below.

    const orderMatch: any = { 
      $expr: { $eq: ['$eventId', '$$eventId'] }, 
      status: { $in: [OrderStatus.CONFIRMED, OrderStatus.REFUNDED] },
      deletedAt: null 
    };
    const issuanceMatch: any = { 
      $expr: { $eq: ['$eventId', '$$eventId'] }, 
      status: { $in: [TicketIssuanceStatus.ACTIVE, TicketIssuanceStatus.CHECKED_IN] },
      deletedAt: null 
    };

    if (dateRange) {
      if (dateRange.from) {
        orderMatch.createdAt = { $gte: new Date(dateRange.from) };
        issuanceMatch.createdAt = { $gte: new Date(dateRange.from) };
      }
      if (dateRange.to) {
        orderMatch.createdAt = { ...orderMatch.createdAt, $lte: new Date(dateRange.to) };
        issuanceMatch.createdAt = { ...issuanceMatch.createdAt, $lte: new Date(dateRange.to) };
      }
    }

    const aggregation = [
      { $match: matchStage },

      // Join ticket types
      {
        $lookup: {
          from: 'tickettypes',
          localField: '_id',
          foreignField: 'eventId',
          as: 'ticketTypes',
        },
      },

      // Join completed orders (scoped to dateRange)
      {
        $lookup: {
          from: 'orders',
          let: { eventId: '$_id' },
          pipeline: [
            { $match: orderMatch }
          ],
          as: 'orders',
        },
      },

      // Join ticket issuances (scoped to dateRange)
      {
        $lookup: {
          from: 'ticketissuances',
          let: { eventId: '$_id' },
          pipeline: [
            { $match: issuanceMatch }
          ],
          as: 'issuances',
        },
      },

      // Compute core metrics
      {
        $addFields: {
          ticketTypeCount: { $ifNull: [{ $size: '$ticketTypes' }, 0] },
          totalCapacity: { $ifNull: [{ $sum: '$ticketTypes.capacity' }, 0] },
          ticketsSold: { $ifNull: [{ $size: '$issuances' }, 0] },
          grossRevenue: {
            $ifNull: [
              {
                $divide: [
                  {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: { $ifNull: ['$orders', []] },
                            as: 'o',
                            cond: { $eq: ['$$o.status', OrderStatus.CONFIRMED] },
                          },
                        },
                        as: 'o',
                        in: { $ifNull: ['$$o.pricing.total', 0] },
                      },
                    },
                  },
                  100
                ]
              },
              0
            ],
          },
          refundedAmount: {
            $ifNull: [
              {
                $divide: [
                  {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: { $ifNull: ['$orders', []] },
                            as: 'o',
                            cond: { $eq: ['$$o.status', OrderStatus.REFUNDED] },
                          },
                        },
                        as: 'o',
                        in: { $ifNull: ['$$o.pricing.total', 0] },
                      },
                    },
                  },
                  100
                ]
              },
              0
            ],
          },
          checkedInCount: {
            $ifNull: [
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ['$issuances', []] },
                    as: 'i',
                    cond: { $eq: ['$$i.checkedIn', true] },
                  },
                },
              },
              0
            ],
          },
          // Promo usage: Count orders that had a promo code applied
          promoCodeUsageCount: {
            $ifNull: [
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ['$orders', []] },
                    as: 'o',
                    cond: { $ne: ['$$o.promoCode', null] }
                  }
                }
              },
              0
            ]
          },
          uniqueAttendees: {
            $size: {
              $ifNull: [
                {
                  $setUnion: [
                    {
                      $map: {
                        input: {
                          $filter: {
                            input: { $ifNull: ['$issuances', []] },
                            as: 'i',
                            cond: { $ne: ['$$i.assignedTo.userId', null] },
                          },
                        },
                        as: 'i',
                        in: '$$i.assignedTo.userId',
                      },
                    },
                    []
                  ]
                },
                []
              ]
            },
          },
          // Ticket type breakdown for expanded row
          ticketTypeBreakdown: {
            $ifNull: [
              {
                $map: {
                  input: { $ifNull: ['$ticketTypes', []] },
                  as: 'tt',
                  in: {
                    typeId: '$$tt._id',
                    name: '$$tt.name',
                    price: { $divide: [{ $ifNull: ['$$tt.price', 0] }, 100] },
                    capacity: '$$tt.capacity',
                    sold: '$$tt.sold',
                    revenue: { $divide: [{ $multiply: [{ $ifNull: ['$$tt.sold', 0] }, { $ifNull: ['$$tt.price', 0] }] }, 100] }
                  }
                }
              },
              []
            ]
          }
        },
      },

      // Secondary calculations
      {
        $addFields: {
          netRevenue: { $ifNull: [{ $subtract: ['$grossRevenue', '$refundedAmount'] }, 0] },
          fillRate: {
            $ifNull: [
              {
                $cond: [
                  { $gt: ['$totalCapacity', 0] },
                  { $multiply: [{ $divide: ['$ticketsSold', '$totalCapacity'] }, 100] },
                  0
                ],
              },
              0
            ]
          },
          checkInRate: {
            $ifNull: [
              {
                $cond: [
                  { $gt: ['$ticketsSold', 0] },
                  { $multiply: [{ $divide: ['$checkedInCount', '$ticketsSold'] }, 100] },
                  0
                ],
              },
              0
            ]
          },
          avgTicketPrice: {
            $ifNull: [
              {
                $cond: [
                  { $gt: ['$ticketsSold', 0] },
                  { $divide: [{ $subtract: ['$grossRevenue', '$refundedAmount'] }, '$ticketsSold'] },
                  0
                ],
              },
              0
            ]
          },
        },
      },

      // Join organizer
      {
        $lookup: {
          from: 'users',
          localField: 'organizerId',
          foreignField: '_id',
          pipeline: [{ $project: { name: 1, email: 1 } }],
          as: 'organizer',
        },
      },
      { $unwind: { path: '$organizer', preserveNullAndEmptyArrays: true } },

      // Sorting — map GraphQL enum values (e.g. START_DATE) to MongoDB field names
      { $sort: { [SORT_FIELD_MAP[sortBy as string] || 'startDate']: (sortOrder === 'ASC' ? 1 : -1) as 1 | -1 } },

      // Pagination $facet
      {
        $facet: {
          nodes: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const result = await EventModel.aggregate(aggregation);
    const nodes = result[0]?.nodes || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasNextPage: skip + nodes.length < totalCount,
        endCursor: Buffer.from(`offset:${skip + nodes.length}`).toString('base64'),
      }
    };
  }

  /**
   * Platform-wide summary KPIs
   */
  static async getPlatformSummary(dateRange?: { from?: string; to?: string }) {
    const orderMatch: any = { status: OrderStatus.CONFIRMED, deletedAt: null };
    const eventMatch: any = { deletedAt: null };

    if (dateRange) {
      if (dateRange.from) {
        orderMatch.createdAt = { ...orderMatch.createdAt, $gte: new Date(dateRange.from) };
        eventMatch.startDate = { ...eventMatch.startDate, $gte: new Date(dateRange.from) };
      }
      if (dateRange.to) {
        orderMatch.createdAt = { ...orderMatch.createdAt, $lte: new Date(dateRange.to) };
        eventMatch.startDate = { ...eventMatch.startDate, $lte: new Date(dateRange.to) };
      }
    }

    const [orderStats, eventStats, attendeeStats, refundStats] = await Promise.all([
      OrderModel.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: null,
            totalGrossRevenueCents: { $sum: '$pricing.total' },
            totalTicketsSold: { $sum: { $sum: '$items.quantity' } },
          },
        },
        {
          $project: {
            totalGrossRevenue: { $divide: ['$totalGrossRevenueCents', 100] },
            totalTicketsSold: 1,
          }
        }
      ]),
      EventModel.aggregate([
        { $match: eventMatch },
        {
          $group: {
            _id: null,
            totalEvents: { $count: {} },
            totalPublishedEvents: { $sum: { $cond: [{ $eq: ['$status', EventStatus.PUBLISHED] }, 1, 0] } },
            totalDraftEvents: { $sum: { $cond: [{ $eq: ['$status', EventStatus.DRAFT] }, 1, 0] } },
            totalCancelledEvents: { $sum: { $cond: [{ $eq: ['$status', EventStatus.CANCELLED] }, 1, 0] } },
          },
        },
      ]),
      TicketIssuanceModel.aggregate([
        { 
          $match: { 
            status: { $in: [TicketIssuanceStatus.ACTIVE, TicketIssuanceStatus.CHECKED_IN] }, 
            deletedAt: null 
          } 
        },
        {
          $group: {
            _id: null,
            totalAttendeesUnique: { $addToSet: '$assignedTo.userId' },
            totalIssued: { $count: {} },
            totalCheckedIn: { $sum: { $cond: [{ $eq: ['$checkedIn', true] }, 1, 0] } },
          },
        },
        {
          $project: {
            totalAttendeesUnique: { $size: '$totalAttendeesUnique' },
            platformCheckInRate: {
              $cond: [
                { $gt: ['$totalIssued', 0] },
                { $multiply: [{ $divide: ['$totalCheckedIn', '$totalIssued'] }, 100] },
                0
              ],
            },
          },
        },
      ]),
      OrderModel.aggregate([
        { $match: { status: OrderStatus.REFUNDED, deletedAt: null } },
        { $group: { _id: null, totalRefundedCents: { $sum: '$pricing.total' } } },
        { $project: { totalRefunded: { $divide: ['$totalRefundedCents', 100] } } }
      ])
    ]);

    const o = orderStats[0] || { totalGrossRevenue: 0, totalTicketsSold: 0 };
    const e = eventStats[0] || { totalEvents: 0, totalPublishedEvents: 0, totalDraftEvents: 0, totalCancelledEvents: 0 };
    const a = attendeeStats[0] || { totalAttendeesUnique: 0, platformCheckInRate: 0 };
    const r = refundStats[0] || { totalRefunded: 0 };

    return {
      totalGrossRevenue: o.totalGrossRevenue,
      totalNetRevenue: o.totalGrossRevenue - r.totalRefunded,
      totalEvents: e.totalEvents,
      totalPublishedEvents: e.totalPublishedEvents,
      totalDraftEvents: e.totalDraftEvents,
      totalCancelledEvents: e.totalCancelledEvents,
      totalTicketsSold: o.totalTicketsSold,
      totalAttendeesUnique: a.totalAttendeesUnique,
      platformCheckInRate: a.platformCheckInRate,
    };
  }
}
