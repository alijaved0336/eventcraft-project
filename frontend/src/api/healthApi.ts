import restClient from './rest';

export interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
}

export const healthApi = {
  check: async (): Promise<HealthResponse> => {
    const response = await restClient.get<HealthResponse>('/health');
    return response.data;
  },
};
