import dotenv from 'dotenv';
import path from 'path';

const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = nodeEnv === 'production' ? '.env.prod' : '.env.dev';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Fallback to default .env if the specific one didn't load everything needed
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/eventcraft',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  oauthCallbackBase: process.env.OAUTH_CALLBACK_BASE || 'http://localhost:4000/api',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  qrJwtSecret: process.env.QR_JWT_SECRET || 'dev-qr-secret-min-32-chars-long-replace-me',
  dailyApiKey: (process.env.DAILY_API_KEY || '').trim(),
  dailyWebhookSecret: (process.env.DAILY_WEBHOOK_SECRET || '').trim(),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
};
