import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import express from 'express';
import { config } from '../src/config';
import { attendanceResolvers } from '../src/graphql/resolvers/attendance.resolver';
import { ticketRouter } from '../src/rest/routes/tickets.routes';
import { TicketIssuanceModel } from '../src/models/ticket-issuance.model';
import { OrderModel } from '../src/models/order.model';
import { TicketIssuanceService } from '../src/services/ticket-issuance.service';
import { createUser, createEvent, createTicketType, createOrder, createIssuance } from './helpers/testFactories';

let mongoServer: MongoMemoryServer;

const app = express();
app.use((req: any, res, next) => {
  if (req.headers.authorization) {
    try {
       const token = req.headers.authorization.split(' ')[1];
       req.user = jwt.verify(token, config.jwtAccessSecret);
    } catch (err) {}
  }
  next();
});
app.use('/api/tickets', ticketRouter);

describe('Check-In Module', () => {
  let organizer: any, staff: any, attendee: any;
  let event: any, ticketType: any, order: any, issuance: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db?.dropDatabase();
    
    organizer = await createUser({ role: 'organizer' });
    staff = await createUser({ role: 'organizer' });
    attendee = await createUser({ role: 'attendee' });
    
    event = await createEvent(organizer._id.toString());
    ticketType = await createTicketType(event._id.toString());
    order = await createOrder(attendee._id.toString(), event._id.toString());
    issuance = await createIssuance(attendee._id.toString(), event._id.toString(), ticketType._id.toString(), order._id.toString());
  });

  describe('GROUP 1: QR Token Generation', () => {
    it('issueTickets() sets a valid qrToken on each TicketIssuance', async () => {
      const issuanceService = new TicketIssuanceService();
      const newItems = [{ _id: new mongoose.Types.ObjectId(), quantity: 1, ticketTypeId: ticketType._id }];
      const created = await issuanceService.issueTickets(order._id, attendee._id, event._id, newItems);
      
      expect(created.length).toBe(1);
      const fetched = await TicketIssuanceModel.findById(created[0]._id).select('+qrToken');
      expect(fetched?.qrToken).toBeDefined();

      const decoded: any = jwt.verify(fetched!.qrToken!, config.qrJwtSecret);
      expect(decoded.tid).toBe(fetched!._id.toString());
      expect(decoded.eid).toBe(event._id.toString());
    });
  });

  describe('GROUP 2: QR Code REST Endpoint', () => {
    it('GET /api/tickets/:id/qr returns PNG for ticket owner', async () => {
      const token = jwt.sign({ id: attendee._id.toString(), role: 'attendee' }, config.jwtAccessSecret, { expiresIn: '1h' });
      const res = await supertest(app)
        .get(`/api/tickets/${issuance._id}/qr`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('image/png');
    });

    it('returns 403 for non-owner', async () => {
      const token = jwt.sign({ id: staff._id.toString(), role: 'organizer' }, config.jwtAccessSecret, { expiresIn: '1h' });
      const res = await supertest(app)
        .get(`/api/tickets/${issuance._id}/qr`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GROUP 3: checkInAttendee Mutation - QR path', () => {
    it('successful QR check-in returns CheckInSuccess', async () => {
      const ctx = { user: { id: staff._id.toString(), role: staff.role }, req: {}, res: {}, userAgent: 'test' };
      const input = { eventId: event._id.toString(), qrToken: issuance.qrToken, method: 'qr' };
      
      const result: any = await attendanceResolvers.Mutation.checkInAttendee(null, { input }, ctx);
      expect(result.__typename).toBe('CheckInSuccess');
      expect(result.ticketIssuance.checkIn.method).toBe('qr');
      expect(result.ticketIssuance.checkIn.checkedInAt).toBeInstanceOf(Date);
      expect(result.attendee.email).toBe(attendee.email);
    });

    it('second scan returns ALREADY_CHECKED_IN', async () => {
      const ctx = { user: { id: staff._id.toString(), role: staff.role }, req: {}, res: {}, userAgent: 'test' };
      const input = { eventId: event._id.toString(), qrToken: issuance.qrToken, method: 'qr' };
      
      await attendanceResolvers.Mutation.checkInAttendee(null, { input }, ctx);
      const result2: any = await attendanceResolvers.Mutation.checkInAttendee(null, { input }, ctx);
      
      expect(result2.__typename).toBe('CheckInError');
      expect(result2.code).toBe('ALREADY_CHECKED_IN');
    });

    it('CRITICAL: concurrent check-in of same ticket - only one succeeds', async () => {
      const ctx = { user: { id: staff._id.toString(), role: staff.role }, req: {}, res: {}, userAgent: 'test' };
      const input = { eventId: event._id.toString(), qrToken: issuance.qrToken, method: 'qr' };

      const promises = [1,2,3,4,5].map(() => attendanceResolvers.Mutation.checkInAttendee(null, { input }, ctx));
      const results: any[] = await Promise.all(promises);

      const successes = results.filter(r => r.__typename === 'CheckInSuccess');
      const errors = results.filter(r => r.__typename === 'CheckInError' && r.code === 'ALREADY_CHECKED_IN');

      expect(successes.length).toBe(1);
      expect(errors.length).toBe(4);
    });

    it('invalid token returns TICKET_NOT_FOUND', async () => {
      const ctx = { user: { id: staff._id.toString(), role: staff.role }, req: {}, res: {}, userAgent: 'test' };
      const badToken = jwt.sign({ tid: 'fake', eid: 'fake' }, 'wrongsecret');
      const result: any = await attendanceResolvers.Mutation.checkInAttendee(null, { input: { eventId: event._id.toString(), qrToken: badToken, method: 'qr' } }, ctx);
      expect(result.code).toBe('TICKET_NOT_FOUND');
    });

    it('cancelled order returns TICKET_INVALID', async () => {
       await OrderModel.findByIdAndUpdate(order._id, { status: 'cancelled' });
       const ctx = { user: { id: staff._id.toString(), role: staff.role }, req: {}, res: {}, userAgent: 'test' };
       const input = { eventId: event._id.toString(), qrToken: issuance.qrToken, method: 'qr' };
       const result: any = await attendanceResolvers.Mutation.checkInAttendee(null, { input }, ctx);
       expect(result.code).toBe('TICKET_INVALID');
    });
  });

  describe('GROUP 4: Manual Checkin', () => {
    it('successful manual returns CheckInSuccess', async () => {
      const ctx = { user: { id: staff._id.toString(), role: staff.role }, req: {}, res: {}, userAgent: 'test' };
      const input = { eventId: event._id.toString(), email: attendee.email, method: 'manual' };
      
      const result: any = await attendanceResolvers.Mutation.checkInAttendee(null, { input }, ctx);
      expect(result.__typename).toBe('CheckInSuccess');
      expect(result.ticketIssuance.checkIn.method).toBe('manual');
    });
  });

  describe('GROUP 4b: Self Check-In', () => {
    it('attendee can self-check-in their own ticket', async () => {
      const ctx = { user: { id: attendee._id.toString(), role: 'attendee' }, req: {}, res: {}, userAgent: 'test' };
      const input = { eventId: event._id.toString(), qrToken: issuance.qrToken, method: 'self' };
      
      const result: any = await attendanceResolvers.Mutation.checkInAttendee(null, { input }, ctx);
      expect(result.__typename).toBe('CheckInSuccess');
      expect(result.ticketIssuance.checkIn.method).toBe('self');
    });

    it('attendee CANNOT self-check-in someone else\'s ticket', async () => {
      const anotherAttendee = await createUser({ role: 'attendee' });
      const ctx = { user: { id: anotherAttendee._id.toString(), role: 'attendee' }, req: {}, res: {}, userAgent: 'test' };
      const input = { eventId: event._id.toString(), qrToken: issuance.qrToken, method: 'self' };
      
      const result: any = await attendanceResolvers.Mutation.checkInAttendee(null, { input }, ctx);
      expect(result.__typename).toBe('CheckInError');
      expect(result.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GROUP 5: Undo Check In', () => {
    it('organizer can undo checkin', async () => {
      const ctx = { user: { id: organizer._id.toString(), role: 'organizer' }, req: {}, res: {}, userAgent: 'test' };
      const input = { eventId: event._id.toString(), email: attendee.email, method: 'manual' };
      await attendanceResolvers.Mutation.checkInAttendee(null, { input }, ctx);
      
      await attendanceResolvers.Mutation.undoCheckIn(null, { ticketIssuanceId: issuance._id.toString() }, ctx);
      const fetched = await TicketIssuanceModel.findById(issuance._id);
      expect(fetched?.checkIn.checkedInAt).toBeNull();
    });
  });

  describe('GROUP 6: attendeeList', () => {
    it('paginates correctly', async () => {
      const ctx = { user: { id: organizer._id.toString(), role: 'organizer' }, req: {}, res: {}, userAgent: 'test' };
      const result: any = await attendanceResolvers.Query.attendeeList(null, { eventId: event._id.toString() }, ctx);
      expect(result.totalCount).toBe(1);
      expect(result.attendees.length).toBe(1);
    });
  });

  describe('GROUP 7: stats', () => {
    it('stats calculated correctly', async () => {
       await TicketIssuanceModel.findByIdAndUpdate(issuance._id, { 'checkIn.checkedInAt': new Date() });
       const ctx = { user: { id: organizer._id.toString(), role: 'organizer' }, req: {}, res: {}, userAgent: 'test' };
       const stats: any = await attendanceResolvers.Query.checkInStats(null, { eventId: event._id.toString() }, ctx);
       expect(stats.total).toBe(1);
       expect(stats.checkedIn).toBe(1);
       expect(stats.checkInRate).toBe(1);
    });
  });
});
