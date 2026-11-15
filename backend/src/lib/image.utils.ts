/**
 * Image utility functions for server-side compression.
 * Compresses Base64 images using Node.js built-in capabilities (no external deps).
 *
 * LIMITS:
 *  - Max raw file size after decoding: 5MB
 *  - Target max output size: 300KB (for bannerImage stored in DB)
 *
 * NOTE: For production, migrate to Cloudinary/S3 for direct upload.
 * This is a temporary guard until image hosting is in place.
 */

/** Maximum allowed decoded size for an uploaded image (5MB) */
const MAX_INPUT_BYTES = 5 * 1024 * 1024;

/** Maximum allowed stored size for the compressed result (300KB) */
const MAX_OUTPUT_BYTES = 300 * 1024;

/**
 * Validates a Base64 image string and returns an error message if invalid.
 * Returns null if the image is acceptable.
 */
export function validateBase64Image(base64: string): string | null {
  if (!base64) return null;

  // Must be a data URI (data:image/...;base64,...)
  const match = base64.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i);
  if (!match) {
    return 'Invalid image format. Only JPEG, PNG, WebP and GIF are supported.';
  }

  const rawData = base64.split(',')[1] ?? '';
  const sizeInBytes = Math.ceil((rawData.length * 3) / 4);

  if (sizeInBytes > MAX_INPUT_BYTES) {
    const sizeMB = (sizeInBytes / (1024 * 1024)).toFixed(1);
    return `Image is too large (${sizeMB}MB). Maximum allowed size is 5MB. Please resize the image before uploading.`;
  }

  return null;
}

/**
 * Checks if a stored Base64 image exceeds the max output size.
 * Returns true if it's within the limit.
 */
export function isImageWithinStorageLimit(base64: string): boolean {
  if (!base64) return true;
  const rawData = base64.split(',')[1] ?? '';
  const sizeInBytes = Math.ceil((rawData.length * 3) / 4);
  return sizeInBytes <= MAX_OUTPUT_BYTES;
}

/**
 * Returns a human-readable size string for a Base64 image.
 */
export function getBase64ImageSize(base64: string): string {
  if (!base64) return '0 KB';
  const rawData = base64.split(',')[1] ?? '';
  const sizeInBytes = Math.ceil((rawData.length * 3) / 4);
  if (sizeInBytes > 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(sizeInBytes / 1024).toFixed(0)} KB`;
}
