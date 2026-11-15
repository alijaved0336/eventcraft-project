import { OrderModel, type IOrderDocument } from '../models/order.model';
import type { Types } from 'mongoose';


export class OrderRepository {
  async create(data: Partial<IOrderDocument>): Promise<IOrderDocument> {
    return await OrderModel.create(data);
  }

  async findById(id: string | Types.ObjectId): Promise<IOrderDocument | null> {
    return await OrderModel.findById(id).lean();
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<IOrderDocument | null> {
    return await OrderModel.findOne({ 'payment.paymentIntentId': paymentIntentId }).lean();
  }

  async updateStatus(id: string | Types.ObjectId, status: string, additionalData: Record<string, unknown> = {}): Promise<IOrderDocument | null> {
    return await OrderModel.findByIdAndUpdate(
      id,
      { $set: { status, ...additionalData } },
      { new: true }
    );
  }

  async findExpiredPendingOrders(now: Date): Promise<IOrderDocument[]> {
    return await OrderModel.find({
      status: 'pending',
      expiresAt: { $lt: now },
    }).lean();
  }

  async findByUser(userId: string | Types.ObjectId, eventId?: string | Types.ObjectId): Promise<IOrderDocument[]> {
    const query: Record<string, unknown> = { userId };
    if (eventId) {
      query.eventId = eventId;
    }
    return await OrderModel.find(query).sort({ createdAt: -1 }).lean();
  }
}
