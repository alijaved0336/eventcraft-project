import { UserModel } from '../models/user.model';
import { logger } from './logger';

/**
 * Checks if a notification should be skipped based on user preferences.
 * @param userId The ID of the user receiving the notification
 * @param type The channel of communication ('email' | 'sms')
 * @param prefKey The path to the preference (e.g. 'notificationPrefs.email.ticketConfirmation')
 * @returns true if the notification should be SKIPPED
 */
export async function shouldSkipNotification(
  userId: string,
  type: 'email' | 'sms',
  prefKey?: string
): Promise<boolean> {
  const user = await UserModel.findById(userId).select('notificationPrefs deletedAt');
  if (!user || user.deletedAt) return true;

  const prefs = user.notificationPrefs;
  if (type === 'sms' && prefs?.sms?.masterOptOut) return true;

  if (prefKey) {
    const keys = prefKey.split('.');
    let current: unknown = typeof user.toObject === 'function' ? user.toObject() : user;
    for (const key of keys) {
      if (current === undefined || current === null) return false;
      current = (current as Record<string, unknown>)[key];
    }
    if (current === false) return true;
  }

  return false;
}
