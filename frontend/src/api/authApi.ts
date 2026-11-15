import restClient from './rest';

export interface Permission {
  action: string;
  level: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  name: string;
  role: string;
  timezone: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface AuthResponse {
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    timezone?: string;
    permissions: Permission[];
  };
  accessToken: string;
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await restClient.post<AuthResponse>('/api/auth/register', data, {
      withCredentials: true,
    });
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await restClient.post<AuthResponse>('/api/auth/login', data, {
      withCredentials: true,
    });
    return response.data;
  },

  refreshToken: async (): Promise<{ accessToken: string }> => {
    const response = await restClient.post<{ accessToken: string }>(
      '/api/auth/refresh',
      {},
      { withCredentials: true },
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
    await restClient.post('/api/auth/logout', {}, { withCredentials: true });
  },

  getGoogleAuthUrl: (): string => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return `${baseUrl}/api/auth/google`;
  },

  handleGoogleCallback: async (code: string): Promise<AuthResponse> => {
    const response = await restClient.get<AuthResponse>(`/api/auth/google/callback?code=${code}`, {
      withCredentials: true,
    });
    return response.data;
  },
};
