import { User } from '@/store/authStore';

interface JwtPayload {
  id?: string;
  userId?: string;
  email?: string;
  role?: string;
  permissions?: { action: string; level: string }[];
  fullName?: string;
  name?: string;
}

/**
 * Decodes a JWT token (without verification) and returns a User object
 * from its payload. This is used as a client-side fallback when the
 * login or refresh API endpoints don't return a user object directly.
 */
export function decodeTokenToUser(token: string): User | null {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;
    // Decode base64url to JSON
    const decoded = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    const payload: JwtPayload = JSON.parse(decoded);
    return {
      id: payload.id || payload.userId || '',
      email: payload.email || '',
      fullName:
        payload.fullName ||
        payload.name ||
        (payload.email
          ? (payload.email.split('@')[0] || '').charAt(0).toUpperCase() +
            (payload.email.split('@')[0] || '').slice(1)
          : ''),
      role: payload.role || '',
      permissions: payload.permissions || [],
    };
  } catch {
    return null;
  }
}
