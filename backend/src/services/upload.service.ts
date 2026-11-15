import { cloudinary } from '../lib/cloudinary';
import { logger } from '../lib/logger';
import { config } from '../config';

const FOLDER = 'eventcraft/events';

export interface BannerUploadResult {
  /** Cloudinary public_id for future deletion/updates */
  publicId: string;
  /** Full-size CDN URL (1200px webp) — stored as bannerImage, used in detail view */
  bannerImage: string;
  /** Thumbnail CDN URL (400px webp) — stored as bannerUrl, used in listing view */
  bannerUrl: string;
}

/**
 * Uploads a Base64-encoded image to Cloudinary and returns
 * both a thumbnail URL and a full-size URL via Cloudinary transformations.
 *
 * Only ONE upload is made — URLs are derived from the same public_id.
 */
export async function uploadEventBanner(base64: string): Promise<BannerUploadResult> {
  const result = await cloudinary.uploader.upload(base64, {
    folder: FOLDER,
    resource_type: 'image',
    // Store original at high quality; serve transformed via URL params
    quality: 'auto',
    fetch_format: 'auto',
    // Strip EXIF data for privacy
    image_metadata: false,
  });

  const publicId = result.public_id;
  const base = `https://res.cloudinary.com/${config.cloudinaryCloudName}/image/upload`;

  const bannerImage = `${base}/f_webp,w_1200,q_auto/${publicId}`;
  const bannerUrl   = `${base}/f_webp,w_400,q_auto/${publicId}`;

  logger.info('Image uploaded to Cloudinary', { publicId, width: result.width, height: result.height });

  return { publicId, bannerImage, bannerUrl };
}

/**
 * Deletes an image from Cloudinary by its public_id.
 * Called when an event banner is replaced with a new one.
 */
export async function deleteEventBanner(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info('Deleted old banner from Cloudinary', { publicId });
  } catch (err) {
    // Non-fatal — log and continue
    logger.warn('Failed to delete old Cloudinary banner', { publicId, err });
  }
}

/**
 * Returns true if the given string looks like a Base64 data URI
 * (i.e. a new upload), vs a Cloudinary URL (i.e. already uploaded).
 */
export function isBase64DataUri(str: string): boolean {
  return str.startsWith('data:');
}
