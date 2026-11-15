import axios from 'axios';
import { tokenStore } from './tokenStore';
import { decodeTokenToUser } from './decodeToken';
import { useAuthStore } from '@/store/authStore';

let refreshPromise: Promise<string | null> | null = null;

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function _doRefresh(): Promise<string | null> {
  try {
    const response = await axios.post<{ accessToken: string }>(
      `${API_BASE}/api/auth/refresh`,
      {},
      { withCredentials: true },
    );

    if (response.status === 200) {
      const { accessToken } = response.data;
      tokenStore.set(accessToken);

      // Sync the auth store with the latest user info from the new token
      const user = decodeTokenToUser(accessToken);
      if (user) {
        useAuthStore.getState().setUser(user);
      }

      return accessToken;
    }
    return null;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 401) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth:logout'));
    }
    return null;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = _doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}
