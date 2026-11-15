import { cacheRedis } from '../lib/redis';
import { AnalyticsRepository, type AdminAnalyticsInput } from '../repositories/analytics.repository';
import crypto from 'crypto';

export class AnalyticsService {
  /**
   * Fetches admin analytics with 5-minute caching.
   */
  static async getAdminEventAnalytics(input: AdminAnalyticsInput) {
    const cacheKey = `admin:analytics:${this.hashInput(input)}`;
    
    try {
      const cached = await cacheRedis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      // Log and continue if Redis fails
      console.error('Redis cache retrieval failed:', err);
    }

    const [eventData, platformSummary] = await Promise.all([
      AnalyticsRepository.getAdminEventAnalytics(input),
      AnalyticsRepository.getPlatformSummary(input.dateRange)
    ]);

    const result = { 
      platformSummary, 
      events: {
        nodes: eventData.nodes,
        totalCount: eventData.totalCount,
        pageInfo: eventData.pageInfo
      } 
    };
    
    try {
      // Cache for 5 minutes (300 seconds)
      await cacheRedis.setex(cacheKey, 300, JSON.stringify(result));
    } catch (err) {
      console.error('Redis cache storage failed:', err);
    }
    
    return result;
  }

  /**
   * Generates a stable hash for cache keys based on input parameters.
   */
  private static hashInput(input: any): string {
    const str = 'v4:' + JSON.stringify(input || {});
    return crypto.createHash('md5').update(str).digest('hex');
  }
}
