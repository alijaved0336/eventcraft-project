import { SessionRepository } from '../repositories/session.repository';
import { EventRepository } from '../repositories/event.repository';
import { type ISessionDocument } from '../models/session.model';
import type { CreateSessionInput, UpdateSessionInput } from '../validators/session.validator';
import { NotFoundError, UnauthorizedError } from '../errors';
import { UserRole } from '../lib/permissions';
import { logger } from '../lib/logger';
import mongoose from 'mongoose';

export class SessionService {
  /**
   * Only event organizer or admin can manage sessions
   */
  private static async _checkPermission(
    eventId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const isAdmin = [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole);
    const isOrganizer =
      event.organizerId instanceof mongoose.Types.ObjectId
        ? event.organizerId.toString() === userId
        : event.organizerId?._id?.toString() === userId;

    if (!isAdmin && !isOrganizer) {
      throw new UnauthorizedError('You do not have permission to manage sessions for this event');
    }
  }

  static async createSession(
    data: CreateSessionInput,
    userId: string,
    userRole: UserRole,
  ): Promise<ISessionDocument> {
    await this._checkPermission(data.eventId, userId, userRole);

    const session = await SessionRepository.create(data as never);
    logger.info('Session created', { sessionId: session.id, eventId: data.eventId, userId });
    return session;
  }

  static async getEventSchedule(eventId: string): Promise<ISessionDocument[]> {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    return SessionRepository.findByEventId(eventId);
  }

  static async updateSession(
    id: string,
    data: UpdateSessionInput,
    userId: string,
    userRole: UserRole,
  ): Promise<ISessionDocument> {
    const session = await SessionRepository.findById(id);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    await this._checkPermission(session.eventId.toString(), userId, userRole);

    const updated = await SessionRepository.updateById(id, data as never);
    if (!updated) {
      throw new NotFoundError('Session not found after update');
    }

    logger.info('Session updated', { sessionId: id, userId });
    return updated;
  }

  static async deleteSession(id: string, userId: string, userRole: UserRole): Promise<void> {
    const session = await SessionRepository.findById(id);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    await this._checkPermission(session.eventId.toString(), userId, userRole);

    await SessionRepository.deleteById(id);
    logger.info('Session deleted', { sessionId: id, userId });
  }
}
