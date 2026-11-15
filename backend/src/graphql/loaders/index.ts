import DataLoader from 'dataloader';
import { UserModel } from '../../models/user.model';
import { EventModel } from '../../models/event.model';
import { Types } from 'mongoose';

/**
 * Batch-load users by ID — replaces N individual User.findById() calls.
 * Cached within the scope of a single request.
 */
export const createUserLoader = () =>
  new DataLoader<string, any>(async (userIds) => {
    const users = await UserModel.find({
      _id: { $in: userIds.map((id) => new Types.ObjectId(id)) },
    })
      .select('_id name email avatar role')
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    return userIds.map((id) => userMap.get(id) ?? null);
  });

/**
 * Batch-load ticket types per event.
 */
export const createTicketTypeLoader = () =>
  new DataLoader<string, any[]>(async (eventIds) => {
    const events = await EventModel.find({
      _id: { $in: eventIds.map((id) => new Types.ObjectId(id)) },
    })
      .select('_id ticketTypes')
      .populate('ticketTypes')
      .lean();

    const map = new Map(events.map((e) => [e._id.toString(), e.ticketTypes || []]));
    return eventIds.map((id) => map.get(id) ?? []);
  });
