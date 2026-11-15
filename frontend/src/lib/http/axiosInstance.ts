import axios, { InternalAxiosRequestConfig } from 'axios';
import { tokenStore } from '../auth/tokenStore';
import { refreshAccessToken } from '../auth/refreshToken';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
});

/**
 * Attaches the access token from the in-memory store to all outgoing requests.
 */
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Handles automatic 401 retries with a singleton-safe token refresh.
 */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Handle 401: attempt to refresh the token and retry once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Update the header and retry the original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        } else {
          // If refresh returned no token, it's a hard failure
          throw new Error('No refresh token available');
        }
      } catch (refreshError) {
        console.error('Auto-refresh failed:', refreshError);
        tokenStore.clear();
        window.dispatchEvent(new Event('auth:logout'));
      }
    }

    return Promise.reject(error);
  },
);

export default api;
