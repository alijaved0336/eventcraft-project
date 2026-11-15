import api from '@/lib/http/axiosInstance';

/**
 * Proxy for the centralized axios instance.
 * Maintained for backward compatibility with existing features.
 * All logic for token injection and 401 retry is in @/lib/http/axiosInstance.
 */
const restClient = api;

export default restClient;
