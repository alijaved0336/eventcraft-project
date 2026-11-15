import { PromoCodeModel, IPromoCodeDocument } from '../models/promo-code.model';
import { Types } from 'mongoose';

export class PromoCodeRepository {
  async findByCode(eventId: string | Types.ObjectId, code: string): Promise<IPromoCodeDocument | null> {
    return await PromoCodeModel.findOne({
      eventId,
      code: code.toUpperCase(),
      isActive: true,
      deletedAt: null
    });
  }

  async usePromoCode(id: string | Types.ObjectId): Promise<IPromoCodeDocument | null> {
    return await PromoCodeModel.findOneAndUpdate(
      {
        _id: id,
        isActive: true,
        deletedAt: null,
        $or: [
          { maxUses: null },
          { $expr: { $lt: ['$usedCount', '$maxUses'] } }
        ]
      },
      { $inc: { usedCount: 1 } },
      { new: true }
    );
  }

  async rollbackPromoCode(id: string | Types.ObjectId): Promise<void> {
    await PromoCodeModel.findByIdAndUpdate(id, { $inc: { usedCount: -1 } });
  }
}
