import Redis from 'ioredis';
import { config } from '../config';

// BullMQ requires maxRetriesPerRequest: null
export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

// Fail-fast client for caching: rejects immediately when Redis is down
// instead of queuing indefinitely (which would cause 504s on Vercel)
export const cacheRedis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});
