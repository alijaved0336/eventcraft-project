import mongoose from 'mongoose';
import { EventModel, type IEventDocument, EventStatus, EventVisibility } from '../models/event.model';

export class EventRepository {
  static async create(data: Partial<IEventDocument>): Promise<IEventDocument> {
    const event = new EventModel(data);
    return event.save();
  }

  static async findById(id: string): Promise<IEventDocument | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return EventModel.findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('organizerId', 'name email avatar')
      .lean()
      .exec() as Promise<IEventDocument | null>;
  }

  static async findByIdFull(id: string): Promise<IEventDocument | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return EventModel.findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('organizerId', 'name email avatar')
      .populate('ticketTypes')
      .lean()
      .exec() as Promise<IEventDocument | null>;
  }

  static async findBySlug(slug: string): Promise<IEventDocument | null> {
    return EventModel.findOne({ slug, deletedAt: { $exists: false } })
      .populate('organizerId', 'name email avatar')
      .lean()
      .exec() as Promise<IEventDocument | null>;
  }

  static async findAll(
    filter: Record<string, unknown> = {},
    limit: number = 20,
    skip: number = 0,
  ): Promise<IEventDocument[]> {
    const query = { ...filter, deletedAt: { $exists: false } };
    return EventModel.find(query)
      .select('-bannerImage -description -gallery -ticketTiers -virtualSession -workflowConfig -bannerPublicId')
      .populate('organizerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec() as Promise<IEventDocument[]>;
  }

  static async updateById(
    id: string,
    data: Partial<IEventDocument>,
  ): Promise<IEventDocument | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return EventModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), deletedAt: { $exists: false } }, // Ensure not deleted
      { $set: data as any },
      { returnDocument: 'after', runValidators: true },
    )
      .populate('organizerId', 'name email avatar')
      .lean()
      .exec() as Promise<IEventDocument | null>;
  }

  static async softDeleteById(id: string): Promise<IEventDocument | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return EventModel.findOneAndUpdate(
      { _id: id },
      { $set: { deletedAt: new Date() } },
      { returnDocument: 'after' },
    );
  }

  static async isOrganizer(eventId: string, userId: string): Promise<boolean> {
    if (!mongoose.isValidObjectId(eventId) || !mongoose.isValidObjectId(userId)) return false;
    const event = await EventModel.findOne({ _id: eventId, organizerId: userId });
    return !!event;
  }

  static async findFeatured(limit: number): Promise<IEventDocument[]> {
    return EventModel.find({
      status: { $in: [EventStatus.PUBLISHED, EventStatus.SCHEDULED, EventStatus.ENDED] },
      visibility: EventVisibility.PUBLIC,
      startDate: { $gte: new Date() },
      deletedAt: { $exists: false },
    })
      .select('-bannerImage -description -gallery -ticketTiers -virtualSession -workflowConfig -bannerPublicId')
      .populate('organizerId', 'name email')
      .sort({ startDate: 1 })
      .limit(limit)
      .lean()
      .exec() as Promise<IEventDocument[]>;
  }
  static async discoverEvents(
    query: string = '',
    lat?: number,
    lng?: number,
    radiusInMeters: number = 50000,
    date?: string,
    limit: number = 10,
    offset: number = 0
  ) {
    const filter: any = {
      status: { $in: [EventStatus.PUBLISHED, EventStatus.SCHEDULED, EventStatus.ENDED] },
      visibility: EventVisibility.PUBLIC,
      deletedAt: { $exists: false }
    };

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ];
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      
      filter.startDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (lat !== undefined && lng !== undefined) {
      const latDelta = radiusInMeters / 111320; 
      const lngDelta = radiusInMeters / (40008000 / 360 * Math.cos(lat * Math.PI / 180));
      filter['location.lat'] = { $gte: lat - latDelta, $lte: lat + latDelta };
      filter['location.lng'] = { $gte: lng - lngDelta, $lte: lng + lngDelta };
    }

    const events = await EventModel.find(filter)
      .select('-bannerImage -description -gallery -ticketTiers -virtualSession -workflowConfig -bannerPublicId')
      .populate('organizerId', 'name email')
      .sort({ startDate: 1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();

    const totalCount = await EventModel.countDocuments(filter);

    return {
      events,
      totalCount,
      hasMore: offset + events.length < totalCount
    };
  }

  static async autocompleteEvents(query: string, limit: number = 5) {
    const filter: any = {
      status: { $in: [EventStatus.PUBLISHED, EventStatus.SCHEDULED, EventStatus.ENDED] },
      visibility: EventVisibility.PUBLIC,
      deletedAt: { $exists: false }
    };

    if (query) {
      filter.title = { $regex: query, $options: 'i' };
    } else {
      return [];
    }

    return EventModel.find(filter)
      .select('title tags')
      .limit(limit)
      .exec();
  }
}
