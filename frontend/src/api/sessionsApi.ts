import restClient from './rest';
import { Session, CreateSessionInput, UpdateSessionInput } from '@/features/events/types';

export const sessionsApi = {
  getByEventId: async (eventId: string): Promise<Session[]> => {
    const response = await restClient.get<Session[]>(`/api/sessions/event/${eventId}`);
    return response.data;
  },

  create: async (data: CreateSessionInput): Promise<Session> => {
    const response = await restClient.post<Session>('/api/sessions', data);
    return response.data;
  },

  update: async (
    _eventId: string,
    sessionId: string,
    data: UpdateSessionInput,
  ): Promise<Session> => {
    const response = await restClient.patch<Session>(`/api/sessions/${sessionId}`, data);
    return response.data;
  },

  delete: async (_eventId: string, sessionId: string): Promise<void> => {
    await restClient.delete(`/api/sessions/${sessionId}`);
  },
};
