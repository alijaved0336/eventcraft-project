/**
 * Migration: Upload existing Base64 bannerImages to Cloudinary
 *
 * Run with:
 *   ./node_modules/.bin/tsx scripts/migrate-banners-to-cloudinary.ts
 *
 * What it does:
 *  1. Finds all events where bannerImage starts with "data:" (Base64 blob)
 *  2. Uploads each image to Cloudinary
 *  3. Updates the event with:
 *       - bannerImage  → full-size CDN URL (1200px webp)
 *       - bannerUrl    → thumbnail CDN URL (400px webp)
 *       - bannerPublicId → Cloudinary public_id for future deletion
 *  4. Skips events that already have a Cloudinary URL or no image
 */

import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../src/config';
import { EventModel } from '../src/models/event.model';

// ─── Cloudinary setup ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
  secure: true,
});

const FOLDER = 'eventcraft/events';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildCdnUrls(publicId: string) {
  const base = `https://res.cloudinary.com/${config.cloudinaryCloudName}/image/upload`;
  return {
    bannerImage: `${base}/f_webp,w_1200,q_auto/${publicId}`,
    bannerUrl:   `${base}/f_webp,w_400,q_auto/${publicId}`,
  };
}

// ─── Migration ───────────────────────────────────────────────────────────────
async function migrate() {
  console.log('\n🔗 Connecting to MongoDB...');
  await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/eventcraft', {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('✅ Connected.\n');

  // Validate Cloudinary config
  if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
    console.error('❌ Cloudinary credentials are missing in config. Check your .env.dev');
    process.exit(1);
  }

  // Find only events with Base64 bannerImage (starts with "data:")
  const events = await EventModel.find({
    bannerImage: { $regex: /^data:/ },
    deletedAt: { $exists: false },
  }).select('_id title bannerImage').lean();

  if (events.length === 0) {
    console.log('✅ No events with Base64 bannerImage found. Nothing to migrate.');
    process.exit(0);
  }

  console.log(`📦 Found ${events.length} event(s) to migrate.\n`);

  let success = 0;
  let failed = 0;

  for (const event of events) {
    const title = event.title || String(event._id);
    process.stdout.write(`⬆️  Uploading: "${title}"... `);

    try {
      const result = await cloudinary.uploader.upload(event.bannerImage as string, {
        folder: FOLDER,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
        image_metadata: false,
      });

      const { bannerImage, bannerUrl } = buildCdnUrls(result.public_id);

      await EventModel.updateOne(
        { _id: event._id },
        {
          $set: {
            bannerImage,
            bannerUrl,
            bannerPublicId: result.public_id,
          },
        },
      );

      console.log(`✅ Done → ${bannerUrl}`);
      success++;
    } catch (err: any) {
      console.log(`❌ FAILED — ${err?.message || err}`);
      failed++;
    }
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`✅ Migrated : ${success}`);
  console.log(`❌ Failed   : ${failed}`);
  console.log(`─────────────────────────────────────\n`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

migrate().catch((err) => {
  console.error('Migration crashed:', err);
  process.exit(1);
});
