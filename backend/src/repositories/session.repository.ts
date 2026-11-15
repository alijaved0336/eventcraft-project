import { SessionModel, type ISessionDocument } from '../models/session.model';
import mongoose from 'mongoose';

export class SessionRepository {
  static async create(data: Partial<ISessionDocument>): Promise<ISessionDocument> {
    const session = new SessionModel(data);
    return session.save();
  }

  static async findById(id: string): Promise<ISessionDocument | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return SessionModel.findById(id).populate('speakerIds', 'name email avatar');
  }

  static async findByEventId(eventId: string): Promise<ISessionDocument[]> {
    if (!mongoose.isValidObjectId(eventId)) return [];
    return SessionModel.find({ eventId })
      .populate('speakerIds', 'name email avatar')
      .sort({ day: 1, order: 1 });
  }

  static async updateById(
    id: string,
    data: Partial<ISessionDocument>,
  ): Promise<ISessionDocument | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return SessionModel.findByIdAndUpdate(
      id,
      { $set: data },
      { returnDocument: 'after', runValidators: true },
    ).populate('speakerIds', 'name email avatar');
  }

  static async deleteById(id: string): Promise<ISessionDocument | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return SessionModel.findByIdAndDelete(id);
  }

  static async deleteByEventId(eventId: string): Promise<void> {
    if (!mongoose.isValidObjectId(eventId)) return;
    await SessionModel.deleteMany({ eventId });
  }
}
