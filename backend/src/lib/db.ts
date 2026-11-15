import mongoose from 'mongoose';
import dns from 'node:dns';
import { config } from '../config';
import { logger } from '../lib/logger';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

/**
 * Cached MongoDB connection. Shared across requests in serverless (Vercel)
 * and initialised once in traditional server mode.
 */
let cached = global.mongoose;



if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Direct URI fallback points to 'test' database to match user's live data
const DIRECT_URI =
  'mongodb://alijmalik04:Ali78648804@ac-i6ckw8t-shard-00-00.vnfu8ev.mongodb.net:27017,ac-i6ckw8t-shard-00-01.vnfu8ev.mongodb.net:27017,ac-i6ckw8t-shard-00-02.vnfu8ev.mongodb.net:27017/test?replicaSet=atlas-i0p8ox-shard-0&authSource=admin&tls=true';

/** Probe DNS — resolves true if SRV/TXT works, false otherwise. */
function probeDns(hostname: string): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 500);
    dns.resolveTxt(hostname, (err) => {
      clearTimeout(timer);
      resolve(!err);
    });
  });
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached!.conn) return cached!.conn;

  if (!cached!.promise) {
    let connectUri = config.mongoUri;
    const isSrv = connectUri.startsWith('mongodb+srv://');

    if (isSrv) {
      const hostname = connectUri.split('@')[1]?.split('/')[0] ?? '';
      if (!(await probeDns(hostname))) {
        logger.warn('SRV DNS timeout — falling back to direct connection');
        connectUri = DIRECT_URI;
      }
    }

    logger.info(`Connecting to MongoDB at: ${connectUri.replace(/:([^@]+)@/, ':****@')}...`);

    cached!.promise = mongoose
      .connect(connectUri, {
        bufferCommands: false,
        family: 4,
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 100,
        minPoolSize: 5,
        heartbeatFrequencyMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((conn) => {
        logger.info(`Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      })
      .catch((err: Error) => {
        logger.error('Failed to connect to MongoDB', { error: err.message });
        cached!.promise = null; // reset promise on failure
        throw err;
      });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}

