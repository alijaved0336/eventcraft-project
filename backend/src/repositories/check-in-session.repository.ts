import { CheckInSessionModel, type ICheckInSessionDocument } from '../models/check-in-session.model';
import type { Types } from 'mongoose';

export class CheckInSessionRepository {
  async create(data: Partial<ICheckInSessionDocument>): Promise<ICheckInSessionDocument> {
    return await CheckInSessionModel.create(data);
  }

  async findByStaff(staffId: string | Types.ObjectId, eventId: string | Types.ObjectId): Promise<ICheckInSessionDocument | null> {
    return await CheckInSessionModel.findOne({ staffId, eventId });
  }

  async findOrCreate(staffId: string | Types.ObjectId, eventId: string | Types.ObjectId): Promise<ICheckInSessionDocument> {
    let session = await this.findByStaff(staffId, eventId);
    if (!session) {
      session = await this.create({ staffId: staffId as any, eventId: eventId as any, stats: { scanned: 0, success: 0, rejected: 0 } });
    }
    return session;
  }

  async incrementStats(staffId: string | Types.ObjectId, eventId: string | Types.ObjectId, type: 'success' | 'rejected'): Promise<void> {
    const update: any = { $inc: { 'stats.scanned': 1 } };
    if (type === 'success') {
      update.$inc['stats.success'] = 1;
    } else {
      update.$inc['stats.rejected'] = 1;
    }

    await CheckInSessionModel.findOneAndUpdate(
      { staffId, eventId },
      update,
      { upsert: true, new: true }
    );
  }
}
