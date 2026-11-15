import restClient from './rest';
import { Event, CreateEventRequest, UpdateEventRequest } from '@/features/events/types';

export const eventsApi = {
  getAll: async (): Promise<Event[]> => {
    const response = await restClient.get<Event[]>('/api/events');
    return response.data;
  },

  getByIdOrSlug: async (idOrSlug: string): Promise<Event> => {
    const response = await restClient.get<Event>(`/api/events/${idOrSlug}`);
    return response.data;
  },

  getDetails: async (id: string): Promise<Event> => {
    const response = await restClient.get<Event>(`/api/events/details/${id}`);
    return response.data;
  },

  getFeatured: async (): Promise<Event[]> => {
    const response = await restClient.get<Event[]>('/api/events/featured');
    return response.data;
  },

  create: async (data: CreateEventRequest): Promise<Event> => {
    const response = await restClient.post<Event>('/api/events', data);
    return response.data;
  },

  update: async (id: string, data: UpdateEventRequest): Promise<Event> => {
    const response = await restClient.patch<Event>(`/api/events/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await restClient.delete(`/api/events/${id}`);
  },
};
