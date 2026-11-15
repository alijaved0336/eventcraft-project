import { create } from 'zustand';
import { tokenStore } from '@/lib/auth/tokenStore';

export interface Permission {
  action: string;
  level: string;
}

export type PermissionAction =
  | 'EVENT_CREATE'
  | 'EVENT_READ'
  | 'EVENT_UPDATE'
  | 'EVENT_DELETE'
  | 'AGENDA_CREATE'
  | 'TICKET_READ';

export type PermissionLevel = '✓' | 'own' | 'none';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  notificationPrefs?: {
    email: {
      ticketConfirmation: boolean;
      eventReminders: boolean;
      ticketAssigned: boolean;
      assignmentRevoked: boolean;
      postEventFollowUp: boolean;
    };
    sms: {
      masterOptOut: boolean;
      eventDayReminders: boolean;
      checkInConfirmation: boolean;
    };
  };
  permissions?: Permission[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setUser: (user: User) => void;
  logout: () => void;
  completeInitialization: () => void;
}

/**
 * Zustand store for lightweight, global authentication state management.
 */
export const useAuthStore = create<AuthState>((set) => {
  // Try to load user from localStorage for immediate UI shell consistency
  const savedUser = localStorage.getItem('user');
  let initialUser = null;
  try {
    initialUser = savedUser ? JSON.parse(savedUser) : null;
  } catch (e) {
    console.error('Failed to parse user from localStorage', e);
  }

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    isInitialized: false,

    setUser: (user) => {
      set({ user, isAuthenticated: true, isInitialized: true });
      // Sync with local fallback if needed for persistence across boots
      localStorage.setItem('user', JSON.stringify(user));
    },

    logout: () => {
      tokenStore.clear();
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    },

    completeInitialization: () => {
      set({ isInitialized: true });
    },
  };
});

/**
 * Permission selector helper for components.
 */
export const selectCan = (
  user: User | null,
  action: PermissionAction,
  requiredLevel: PermissionLevel = '✓',
): boolean => {
  if (!user) return false;

  // Role-based bypass
  if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'organizer')
    return true;

  if (!user.permissions) return false;

  const permission = user.permissions.find((p) => p.action === action);
  if (!permission) return false;

  if (requiredLevel === '✓') {
    return permission.level === '✓' || permission.level === 'own';
  }

  if (requiredLevel === 'own') {
    return permission.level === 'own' || permission.level === '✓';
  }

  return false;
};
