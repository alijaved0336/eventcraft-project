import { type Request, type Response } from 'express';
import { Permission, ROLE_PERMISSIONS, UserRole } from '../lib/permissions';
import { ForbiddenError, UnauthorizedError } from '../errors';
import { EventMemberModel } from '../models/event-member.model';
import type mongoose from 'mongoose';

/**
 * REST Middleware: Basic permission check
 * Returns 403 if the user's role does not have the permission at ANY level (✓, own, assigned)
 */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: any) => {
    const user = req.user;
    if (!user) {
      return next(new UnauthorizedError());
    }

    const level = ROLE_PERMISSIONS[user.role][permission];
    if (!level || level === '-') {
      return next(new ForbiddenError(`Required permission: ${permission}`));
    }

    next();
  };
}

/**
 * Service Layer / Resolver Helper: Full access check including Ownership and Assignment
 */
export async function assertAccess(
  permission: Permission,
  user: { id: string; role: UserRole },
  context?: { 
    organizerId?: string | mongoose.Types.ObjectId; 
    eventId?: string | mongoose.Types.ObjectId;
  }
): Promise<void> {
  const level = ROLE_PERMISSIONS[user.role]?.[permission] || '-';

  if (level === '-') {
    throw new ForbiddenError(`Required permission: ${permission}`);
  }

  if (level === '✓') {
    return; // Unconditional access
  }

  if (level === 'own') {
    if (!context?.organizerId) {
      throw new ForbiddenError('Ownership check failed: No organizerId provided');
    }
    const organizerIdStr = (context.organizerId as any)?._id?.toString() || context.organizerId.toString();
    if (organizerIdStr !== user.id) {
      throw new ForbiddenError('Access Denied: You do not own this resource');
    }
    return;
  }

  if (level === 'assigned') {
    if (!context?.eventId) {
      throw new ForbiddenError('Assignment check failed: No eventId provided');
    }
    const isMember = await EventMemberModel.exists({
      eventId: context.eventId,
      userId: user.id
    });
    if (!isMember) {
      throw new ForbiddenError('Access Denied: You are not assigned to this event');
    }
    return;
  }
}

/**
 * Helper to check if a user is the owner of an event
 */
export function requireOwnership(userId: string, organizerId: string | mongoose.Types.ObjectId): void {
  if (organizerId.toString() !== userId) {
    throw new ForbiddenError('Ownership required');
  }
}

/**
 * Helper to check if a user is assigned to an event
 */
export async function requireAssignment(userId: string, eventId: string | mongoose.Types.ObjectId): Promise<void> {
  const isMember = await EventMemberModel.exists({
    eventId,
    userId
  });
  if (!isMember) {
    throw new ForbiddenError('Event assignment required');
  }
}
