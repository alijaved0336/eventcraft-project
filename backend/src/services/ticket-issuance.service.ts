import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import mongoose, { Types } from 'mongoose';
import { TicketIssuanceRepository } from '../repositories/ticket-issuance.repository';
import { logger } from '../lib/logger';
import { config } from '../config';
import type { ITicketIssuanceDocument } from '../models/ticket-issuance.model';

export class TicketIssuanceService {
  private ticketIssuanceRepository: TicketIssuanceRepository;

  constructor() {
    this.ticketIssuanceRepository = new TicketIssuanceRepository();
  }

  async generateQrCode(data: string): Promise<string> {
    return await QRCode.toDataURL(data);
  }

  async issueTickets(
    orderId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    eventId: string | Types.ObjectId,
    items: any[],
    defaultAttendee?: { name: string; email: string; jobTitle?: string },
    guests?: Array<{ issuanceIndex: number; name: string; email: string }>
  ): Promise<ITicketIssuanceDocument[]> {
    const issuances: any[] = [];
    let globalIndex = 0;

    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        const guestInfo = guests?.find((g) => g.issuanceIndex === globalIndex);
        const attendee = guestInfo || (item.attendees && item.attendees[i]) || defaultAttendee;
        const issuanceId = new mongoose.Types.ObjectId();

        const qrToken = jwt.sign(
          { tid: issuanceId.toString(), eid: eventId.toString() },
          config.qrJwtSecret,
          { expiresIn: '30d' }
        );

        let assignedTo = null;
        if (globalIndex === 0) {
          // First ticket is always assigned to the buyer
          assignedTo = {
            userId: new Types.ObjectId(userId.toString()),
            name: defaultAttendee?.name || 'Buyer',
            email: defaultAttendee?.email || '',
            assignedAt: new Date(),
          };
        } else if (guestInfo) {
          assignedTo = {
            userId: null,
            name: guestInfo.name,
            email: guestInfo.email,
            assignedAt: new Date(),
          };
        }

        issuances.push({
          _id: issuanceId,
          orderId,
          orderItemId: item._id,
          eventId,
          userId,
          ticketTypeId: item.ticketTypeId,
          attendeeName: attendee?.name || 'Guest',
          attendeeEmail: attendee?.email || 'N/A',
          jobTitle: attendee?.jobTitle,
          qrToken,
          ticketNumber: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'active',
          checkedIn: false,
          checkIn: {
            checkedInAt: null,
            checkedInBy: null,
            method: null,
            deviceInfo: null,
            location: null,
          },
          assignedTo,
        });

        globalIndex++;
      }
    }

    const created = (await this.ticketIssuanceRepository.createMany(
      issuances as any[]
    )) as ITicketIssuanceDocument[];

    // Parallelized Guest QR Email enqueuing removed (Redis-free migration)
    created.forEach(issuance => {
      if (issuance.assignedTo?.email && !issuance.assignedTo?.userId) {
        logger.info(`Guest QR email needed for issuance ${issuance._id}`);
      }
    });

    return created;
  }

  async sendConfirmationEmail(orderId: string): Promise<void> {
    // TODO: Implement email sending logic (SendGrid/Nodemailer)
    logger.info(`Sending confirmation email for order ${orderId}`);
  }
}
