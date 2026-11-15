import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { UserModel, type IUserDocument } from '../../models/user.model';
import { RefreshTokenModel } from '../../models/refresh-token.model';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import { ConflictError, UnauthorizedError, NotFoundError, AppError } from '../../errors';
import { logger } from '../../lib/logger';

/**
 * Interface for notification preference updates
 */
export interface NotificationPrefsInput {
  email?: {
    ticketConfirmation?: boolean;
    eventReminders?: boolean;
    ticketAssigned?: boolean;
    assignmentRevoked?: boolean;
    postEventFollowUp?: boolean;
  };
  sms?: {
    masterOptOut?: boolean;
    eventDayReminders?: boolean;
    checkInConfirmation?: boolean;
  };
}

export class SettingsService {
  /**
   * Update basic profile information
   */
  async updateProfile(
    userId: string,
    input: { name?: string; phone?: string; bio?: string }
  ): Promise<IUserDocument> {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: input },
      { new: true, runValidators: true }
    );
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  /**
   * Upload avatar from base64 string
   */
  async uploadAvatar(userId: string, base64Image: string, mimeType: string): Promise<IUserDocument> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new AppError(400, 'INVALID_MIME_TYPE', 'Invalid mime type for avatar');
    }

    // Strip prefix if present (e.g. "data:image/png;base64,")
    const base64Data = base64Image.includes('base64,')
      ? (base64Image.split('base64,')[1] || '')
      : base64Image;

    // Validate size (5MB limit: ~6.7M characters in base64)
    // 5 * 1024 * 1024 * (4/3) = 6,990,507
    if (base64Data.length > 6990507) {
      throw new AppError(400, 'FILE_TOO_LARGE', 'Avatar image cannot exceed 5MB');
    }

    const avatarDataUrl = `data:${mimeType};base64,${base64Data}`;
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { avatar: avatarDataUrl } },
      { new: true }
    );
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  /**
   * Remove avatar
   */
  async removeAvatar(userId: string): Promise<IUserDocument> {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { avatar: null } },
      { new: true }
    );
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  /**
   * Request email change with verification token
   */
  async requestEmailChange(userId: string, newEmail: string): Promise<boolean> {
    const normalizedEmail = newEmail.toLowerCase().trim();
    const existing = await UserModel.findOne({ email: normalizedEmail, deletedAt: null });
    if (existing) throw new ConflictError('Email already in use');

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await UserModel.findByIdAndUpdate(userId, {
      $set: {
        pendingEmail: normalizedEmail,
        pendingEmailToken: hashedToken,
        pendingEmailExpiresAt: expiresAt,
      },
    });

    // Email verification job removed (Redis-free migration)
    logger.info(`Email change requested for user ${userId} to ${normalizedEmail}. Token: ${token}`);

    return true;
  }

  /**
   * Confirm email change using token
   */
  async confirmEmailChange(token: string): Promise<IUserDocument> {
    const user = await UserModel.findOne({
      pendingEmailToken: { $ne: null },
      pendingEmailExpiresAt: { $gt: new Date() },
    }).select('+pendingEmailToken');

    if (!user || !user.pendingEmailToken) {
      throw new UnauthorizedError('Invalid or expired email change token');
    }

    const isValid = await bcrypt.compare(token, user.pendingEmailToken);
    if (!isValid) throw new UnauthorizedError('Invalid email change token');

    const newEmail = user.pendingEmail!;
    
    await UserModel.findByIdAndUpdate(user.id, {
      $set: { email: newEmail },
      $unset: {
        pendingEmail: 1,
        pendingEmailToken: 1,
        pendingEmailExpiresAt: 1,
      },
    });

    // Invalidate all tokens for this user (security breach precaution)
    await RefreshTokenRepository.revokeAllForUser(user.id);

    const updatedUser = await UserModel.findById(user.id);
    return updatedUser!;
  }

  /**
   * Change password for email/password users
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await UserModel.findById(userId).select('+passwordHash');
    if (!user) throw new NotFoundError('User not found');

    if (user.oauthProvider && !user.passwordHash) {
      throw new AppError(400, 'OAUTH_ONLY', 'This account uses Google login. Set a password first.');
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) throw new UnauthorizedError('Current password incorrect');

    user.passwordHash = newPassword; // hashed by pre-save hook in model
    await user.save();

    // Revoke all refresh families
    await RefreshTokenRepository.revokeAllForUser(user.id);

    return true;
  }

  /**
   * Set password for the first time for OAuth users
   */
  async setPassword(userId: string, newPassword: string): Promise<boolean> {
    const user = await UserModel.findById(userId).select('+passwordHash');
    if (!user) throw new NotFoundError('User not found');

    if (user.passwordHash) {
      throw new AppError(400, 'PASSWORD_ALREADY_SET', 'Password already exists. Use changePassword instead.');
    }

    user.passwordHash = newPassword;
    await user.save();

    return true;
  }

  /**
   * Update notification partial preferences
   */
  async updateNotificationPrefs(userId: string, input: NotificationPrefsInput): Promise<IUserDocument> {
    const update: Record<string, boolean> = {};
    
    if (input.email) {
      Object.entries(input.email).forEach(([key, val]) => {
        update[`notificationPrefs.email.${key}`] = val as boolean;
      });
    }

    if (input.sms) {
      Object.entries(input.sms).forEach(([key, val]) => {
        update[`notificationPrefs.sms.${key}`] = val as boolean;
      });
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    );

    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  /**
   * List active refresh token sessions
   */
  async getActiveSessions(userId: string, currentFamily?: string) {
    const sessions = await RefreshTokenModel.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).sort({ 'deviceInfo.lastUsedAt': -1 });

    return sessions.map(s => ({
      sessionId: s._id.toString(),
      userAgent: s.userAgent || 'Unknown',
      ip: s.ipAddress || 'Unknown',
      lastUsedAt: s.createdAt,
      isCurrent: s.familyId === currentFamily
    }));
  }

  /**
   * Revoke a specific session family
   */
  async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    const session = await RefreshTokenModel.findOne({ _id: sessionId, userId });
    if (!session) throw new NotFoundError('Session not found');

    await RefreshTokenRepository.revokeFamily(session.familyId);
    return true;
  }

  /**
   * Revoke all EXCEPT the current session family
   */
  async revokeAllOtherSessions(userId: string, currentFamily: string): Promise<boolean> {
    await RefreshTokenModel.updateMany(
      { userId, familyId: { $ne: currentFamily } },
      { isRevoked: true, revokedAt: new Date() }
    );
    return true;
  }

  /**
   * Schedule account deletion (30 days)
   */
  async requestAccountDeletion(userId: string): Promise<boolean> {
    const deletionScheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    await UserModel.findByIdAndUpdate(userId, {
      $set: { deletionScheduledAt }
    });

    // Account deletion and confirmation jobs removed (Redis-free migration)
    logger.info(`Account deletion requested for user ${userId}. Scheduled for ${deletionScheduledAt}`);

    return true;
  }

  /**
   * Cancel account deletion
   */
  async cancelAccountDeletion(userId: string): Promise<boolean> {
    const user = await UserModel.findById(userId).select('+deletionScheduledAt');
    if (!user?.deletionScheduledAt) {
      throw new AppError(400, 'NO_DELETION_SCHEDULED', 'No deletion is scheduled for this account');
    }

    if (user.deletionScheduledAt < new Date()) {
      throw new AppError(400, 'DELETION_IN_PROGRESS', 'Deletion is already in progress');
    }

    await UserModel.findByIdAndUpdate(userId, {
      $set: { deletionScheduledAt: null }
    });

    // Job removal from queue skipped (Redis-free migration)

    return true;
  }

  /**
   * Enqueue GDPR data export job
   */
  async requestDataExport(userId: string): Promise<boolean> {
    // Data export job removed (Redis-free migration)
    logger.info(`Data export requested for user ${userId}`);
    return true;
  }
}
