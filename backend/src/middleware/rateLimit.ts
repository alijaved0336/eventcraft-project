import { Request, Response, NextFunction } from 'express';

const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple In-memory rate limiter (per instance)
 */
export function rateLimit(limit: number, windowSeconds: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rawIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const ip = Array.isArray(rawIp) ? rawIp[0] : (rawIp as string);
    const key = `ratelimit:${ip}:${req.path}`;
    const now = Date.now();
    
    let record = memoryStore.get(key);
    
    // Cleanup expired record
    if (record && record.resetAt < now) {
      memoryStore.delete(key);
      record = undefined;
    }

    if (!record) {
      record = { count: 1, resetAt: now + windowSeconds * 1000 };
      memoryStore.set(key, record);
    } else {
      record.count++;
    }

    if (record.count > limit) {
      res.status(429).json({ message: 'Too many requests' });
      return;
    }

    next();
  };
}
