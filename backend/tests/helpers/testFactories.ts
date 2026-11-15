import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { UserModel } from '../../src/models/user.model';
import { EventModel } from '../../src/models/event.model';
import { TicketTypeModel } from '../../src/models/ticket-type.model';
import { OrderModel } from '../../src/models/order.model';
import { TicketIssuanceModel } from '../../src/models/ticket-issuance.model';
import { config } from '../../src/config';

export async function createUser(overrides: any = {}) {
  const user = new UserModel({
    name: 'Test User',
    email: `test${Date.now()}@test.com`,
    role: 'attendee',
    isEmailVerified: true,
    authProviders: [{ provider: 'email', providerId: `test${Date.now()}@test.com` }],
    passwordHash: 'dummy',
    ...overrides,
  });
  return await user.save();
}

export async function createEvent(organizerId: string, overrides: any = {}) {
  const event = new EventModel({
    title: 'Test Event',
    description: 'Test Description',
    organizerId,
    startDate: new Date(Date.now() + 86400000),
    endDate: new Date(Date.now() + 172800000),
    timezone: 'UTC',
    location: { type: 'virtual', address: 'Online' },
    status: 'published',
    visibility: 'PUBLIC',
    currency: 'USD',
    capacity: 100,
    ...overrides,
  });
  return await event.save();
}

export async function createTicketType(eventId: string, overrides: any = {}) {
  const type = new TicketTypeModel({
    eventId,
    name: 'General Admission',
    price: 10,
    capacity: 50,
    currency: 'USD',
    isActive: true,
    ...overrides,
  });
  return await type.save();
}

export async function createOrder(userId: string, eventId: string, overrides: any = {}) {
  const order = new OrderModel({
    userId,
    eventId,
    referenceNumber: `ORD-${Date.now()}`,
    status: 'completed',
    subtotal: 10,
    total: 10,
    currency: 'USD',
    ...overrides,
  });
  return await order.save();
}

export async function createIssuance(userId: string, eventId: string, ticketTypeId: string, orderId: string, overrides: any = {}) {
  const id = new mongoose.Types.ObjectId();
  const qrToken = jwt.sign(
    { tid: id.toString(), eid: eventId },
    config.qrJwtSecret,
    { expiresIn: '30d' }
  );

  const issuance = new TicketIssuanceModel({
    _id: id,
    userId,
    eventId,
    ticketTypeId,
    orderId,
    orderItemId: new mongoose.Types.ObjectId(),
    ticketNumber: `TKT-${id.toString().substring(0, 8)}`,
    status: 'active',
    qrToken,
    attendeeName: 'Test Attendee',
    attendeeEmail: 'attendee@test.com',
    ...overrides,
  });
  
  return await issuance.save();
}
