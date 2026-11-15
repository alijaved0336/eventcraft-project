import restClient from './rest';

export interface VirtualSession {
  id: string;
  roomName: string;
  joinUrl: string;
  hostUrl?: string;
  isLive: boolean;
}

export const livestreamApi = {
  /**
   * Connect to or initialize a virtual room for an event.
   * If force is true, it may attempt to recreate the room if it's broken.
   */
  connect: async (eventId: string, force: boolean = false): Promise<VirtualSession> => {
    const response = await restClient.post<VirtualSession>(`/api/streams/${eventId}/connect`, {
      force,
    });
    return response.data;
  },

  /**
   * Terminate a virtual session and disconnect all participants.
   */
  end: async (eventId: string): Promise<void> => {
    await restClient.post(`/api/streams/${eventId}/end`);
  },

  /**
   * Retrieve a secure join token for an attendee.
   */
  getAttendeeToken: async (eventId: string, issuanceId: string): Promise<{ token: string }> => {
    const response = await restClient.post<{ token: string }>(
      `/api/streams/${eventId}/ticket/${issuanceId}/token`,
    );
    return response.data;
  },
};
