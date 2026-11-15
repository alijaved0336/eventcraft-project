import { OrderRepository } from '../repositories/order.repository';
import { TicketTypeRepository } from '../repositories/ticket-type.repository';
import { PromoCodeRepository } from '../repositories/promo-code.repository';
import { PaymentService } from './payment.service';
import { TicketIssuanceService } from './ticket-issuance.service';
import { OrderStatus, type IOrderItem, type IOrder } from '../models/order.model';
import { DiscountType } from '../models/promo-code.model';
import { Types } from 'mongoose';
import { UserRepository } from '../repositories/user.repository';
import { NotFoundError, ValidationError } from '../errors';
import { logger } from '../lib/logger';

export class OrderService {
  private orderRepository: OrderRepository;
  private ticketTypeRepository: TicketTypeRepository;
  private promoCodeRepository: PromoCodeRepository;
  private paymentService: PaymentService;
  private ticketIssuanceService: TicketIssuanceService;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.ticketTypeRepository = new TicketTypeRepository();
    this.promoCodeRepository = new PromoCodeRepository();
    this.paymentService = new PaymentService();
    this.ticketIssuanceService = new TicketIssuanceService();
  }

  async createOrder(
    userId: string, 
    eventId: string, 
    items: { ticketTypeId: string; quantity: number; attendees?: any[] }[], 
    promoCode?: string,
    guests?: Array<{ issuanceIndex: number; name: string; email: string }>
  ) {
    const start = Date.now();
    
    // 1. Batch fetch all ticket types in parallel
    const ticketTypeIds = items.map(item => item.ticketTypeId);
    const ticketTypes = await this.ticketTypeRepository.findManyByIds(ticketTypeIds);
    const ticketTypeMap = new Map(ticketTypes.map(tt => [tt._id.toString(), tt]));

    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    // 2. Validate all and prepare line items
    for (const item of items) {
      const ticketType = ticketTypeMap.get(item.ticketTypeId);
      if (!ticketType || !ticketType.isActive) {
        throw new NotFoundError(`Ticket type ${item.ticketTypeId} not found or inactive`);
      }
      
      const lineTotal = ticketType.price * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        ticketTypeId: ticketType._id as Types.ObjectId,
        ticketTypeSnapshot: {
          name: ticketType.name,
          price: ticketType.price,
          currency: ticketType.currency,
        },
        quantity: item.quantity,
        unitPrice: ticketType.price,
        lineTotal,
        attendees: item.attendees as any,
      });
    }

    // 3. Parallel Inventory Reservation
    const reservationPromises = items.map(item => 
      this.ticketTypeRepository.reserveTickets(item.ticketTypeId, item.quantity)
    );
    const reservationResults = await Promise.all(reservationPromises);
    
    if (reservationResults.some(res => !res)) {
      // Rollback any successful reservations if one fails
      // Note: In local dev/low load, this is rare. For high scale, consider a more robust transaction.
      await Promise.all(items.map((item, idx) => {
        if (reservationResults[idx]) {
          return this.ticketTypeRepository.releaseTickets(item.ticketTypeId, item.quantity);
        }
        return Promise.resolve();
      }));
      throw new ValidationError('Insufficient inventory for one or more items');
    }

    // 4. Resolve Promo Code (Optimized)
    let discount = 0;
    let promoId: Types.ObjectId | undefined;
    let promoSnapshot: IOrder['promoCodeSnapshot'];

    if (promoCode) {
      const promo = await this.promoCodeRepository.findByCode(eventId, promoCode);
      if (promo) {
        const used = await this.promoCodeRepository.usePromoCode(promo._id as Types.ObjectId);
        if (used) {
          promoId = promo._id as Types.ObjectId;
          promoSnapshot = {
            code: promo.code,
            discountType: promo.discountType,
            value: promo.value,
          };
          if (promo.discountType === DiscountType.PERCENTAGE) {
            discount = Math.floor((subtotal * promo.value) / 100);
          } else {
            discount = Math.min(promo.value, subtotal);
          }
        }
      }
    }

    const total = subtotal - discount;
    const currency = orderItems[0]?.ticketTypeSnapshot.currency || 'USD';
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 5. Speculative Parallel Execution (Stripe + DB + Queue)
    // We generate the ID upfront so Stripe metadata can reference it immediately
    const orderId = new Types.ObjectId();

    const orderData: any = {
      _id: orderId,
      userId: new Types.ObjectId(userId),
      eventId: new Types.ObjectId(eventId),
      status: OrderStatus.PENDING,
      items: orderItems,
      pricing: { subtotal, discount, total, currency },
      expiresAt,
      guests,
    };

    if (promoId) orderData.promoCode = promoId;
    if (promoSnapshot) orderData.promoCodeSnapshot = promoSnapshot;

    // Trigger all heavy tasks concurrently
    const dbPromise = this.orderRepository.create(orderData);
    if (total === 0) {
      await dbPromise;
      return await this.confirmOrder(orderId.toString());
    }

    const stripePromise = this.paymentService.createPaymentIntent(total, currency, {
      orderId: orderId.toString(),
    });

    // Wait for Stripe and DB to finish
    const [order, paymentIntent] = await Promise.all([dbPromise, stripePromise]);

    // Update with payment intent ID 
    await this.orderRepository.updateStatus(order.id, OrderStatus.PENDING, {
      'payment.paymentIntentId': paymentIntent.id,
    });

    logger.info('Order creation optimized flow completed', { 
      orderId: order.id, 
      duration: `${Date.now() - start}ms` 
    });

    return {
      order,
      clientSecret: paymentIntent.client_secret,
    };
  }

  async confirmOrder(orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.status !== OrderStatus.PENDING) {
      return order;
    }

    // Atomic move reserved -> sold for each item in parallel
    const confirmPromises = order.items.map(item => 
      this.ticketTypeRepository.confirmTickets(item.ticketTypeId, item.quantity)
    );

    const [updatedOrder, user] = await Promise.all([
      this.orderRepository.updateStatus(orderId, OrderStatus.CONFIRMED, {
        'payment.paidAt': new Date(),
      }),
      UserRepository.findById(order.userId.toString()),
      ...confirmPromises
    ]) as [any, any, ...any[]];

    if (!updatedOrder) return order;

    // Create issuances
    const defaultAttendee = user ? { 
      name: user.name, 
      email: user.email, 
      jobTitle: user.jobTitle 
    } : undefined;

    await this.ticketIssuanceService.issueTickets(orderId, order.userId, order.eventId, order.items, defaultAttendee as any, order.guests);

    // Send confirmation email synchronously (background)
    this.ticketIssuanceService.sendConfirmationEmail(orderId).catch(err => {
      logger.error('Failed to send confirmation email', { orderId, error: err.message });
    });

    return updatedOrder;
  }

  async failOrder(orderId: string, reason?: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.status !== OrderStatus.PENDING) return;

    // Release inventory
    for (const item of order.items) {
      await this.ticketTypeRepository.releaseTickets(item.ticketTypeId, item.quantity);
    }

    // Rollback promo code
    if (order.promoCode) {
      await this.promoCodeRepository.rollbackPromoCode(order.promoCode);
    }

    await this.orderRepository.updateStatus(orderId, OrderStatus.FAILED, {
      'payment.failureReason': reason,
    });
  }

  async expireOrder(orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order || (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.EXPIRED)) return;

    if (order.status === OrderStatus.EXPIRED) return;

    // Release inventory
    for (const item of order.items) {
      await this.ticketTypeRepository.releaseTickets(item.ticketTypeId.toString(), item.quantity);
    }

    if (order.promoCode) {
      await this.promoCodeRepository.rollbackPromoCode(order.promoCode.toString());
    }

    await this.orderRepository.updateStatus(orderId, OrderStatus.EXPIRED);
    logger.info(`Order ${orderId} expired and inventory released`);
  }

  async getMyOrders(userId: string, eventId?: string) {
    const orders = await this.orderRepository.findByUser(userId, eventId);
    
    // Proactively sync/expire orders
    const processedOrders = await Promise.all(orders.map(async (o) => {
      if (o.status === OrderStatus.PENDING) {
        // 1. Check for lazy expiration
        if (o.expiresAt && o.expiresAt < new Date()) {
          await this.expireOrder(o.id);
          return await this.orderRepository.findById(o.id);
        }
        // 2. Sync with Stripe if needed
        if (o.payment?.paymentIntentId) {
          return await this.syncOrderStatus(o.id);
        }
      }
      return o;
    }));
    
    return processedOrders.filter((o): o is any => !!o);
  }

  async getOrder(orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (order && order.status === OrderStatus.PENDING) {
      // Lazy expiration
      if (order.expiresAt && order.expiresAt < new Date()) {
        await this.expireOrder(orderId);
        return await this.orderRepository.findById(orderId);
      }
      // Sync with Stripe
      if (order.payment?.paymentIntentId) {
        return await this.syncOrderStatus(orderId);
      }
    }
    return order;
  }

  async syncOrderStatus(orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.status !== OrderStatus.PENDING || !order.payment?.paymentIntentId) {
      return order;
    }

    try {
      const paymentIntent = await this.paymentService.retrievePaymentIntent(order.payment.paymentIntentId);
      if (paymentIntent.status === 'succeeded') {
        return await this.confirmOrder(orderId);
      } else if (paymentIntent.status === 'canceled') {
        await this.failOrder(orderId, 'Payment cancelled at provider');
        return await this.orderRepository.findById(orderId);
      }
    } catch (err) {
      logger.error('Failed to sync order status with Stripe', { orderId, error: err });
    }

    return order;
  }
}
