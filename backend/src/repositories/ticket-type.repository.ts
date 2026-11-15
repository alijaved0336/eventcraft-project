import { TicketTypeModel, ITicketTypeDocument } from '../models/ticket-type.model';
import { Types } from 'mongoose';

export class TicketTypeRepository {
  async findById(id: string | Types.ObjectId): Promise<ITicketTypeDocument | null> {
    return await TicketTypeModel.findById(id);
  }

  async findManyByIds(ids: Array<string | Types.ObjectId>): Promise<ITicketTypeDocument[]> {
    return await TicketTypeModel.find({ _id: { $in: ids } });
  }

  async findByEventId(eventId: string | Types.ObjectId): Promise<ITicketTypeDocument[]> {
    return await TicketTypeModel.find({ eventId, isActive: true, deletedAt: null });
  }

  async reserveTickets(ticketTypeId: string | Types.ObjectId, quantity: number): Promise<ITicketTypeDocument | null> {
    return await TicketTypeModel.findOneAndUpdate(
      {
        _id: ticketTypeId,
        $expr: {
          $lte: [
            { $add: ['$sold', '$reserved', quantity] },
            '$capacity'
          ]
        }
      },
      { $inc: { reserved: quantity } },
      { new: true }
    );
  }

  async confirmTickets(ticketTypeId: string | Types.ObjectId, quantity: number): Promise<void> {
    await TicketTypeModel.findByIdAndUpdate(ticketTypeId, {
      $inc: { sold: quantity, reserved: -quantity }
    });
  }

  async releaseTickets(ticketTypeId: string | Types.ObjectId, quantity: number): Promise<void> {
    await TicketTypeModel.findByIdAndUpdate(ticketTypeId, {
      $inc: { reserved: -quantity }
    });
  }

  async createMany(data: any[]): Promise<ITicketTypeDocument[]> {
    return (await TicketTypeModel.insertMany(data)) as unknown as ITicketTypeDocument[];
  }

  async upsertMany(eventId: string | Types.ObjectId, tickets: any[]): Promise<ITicketTypeDocument[]> {
    const results: ITicketTypeDocument[] = [];
    for (const ticket of tickets) {
      const updated = await TicketTypeModel.findOneAndUpdate(
        { eventId, name: ticket.name },
        { $set: { ...ticket, eventId } },
        { upsert: true, new: true, runValidators: true }
      );
      if (updated) results.push(updated);
    }
    return results;
  }
}
