import Hashids from 'hashids';

// Use environment variable for salt, fallback for development
const ID_SALT = process.env.VIDEO_ID_SALT || 'default-dev-salt-change-in-production';

const hashids = new Hashids(
  ID_SALT,
  8, // minimum length
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
);

/**
 * Encode a video ID into a non-sequential hash string
 * @param id - The numeric video ID
 * @returns Encoded hash string (e.g., "aBc7Kx9d")
 */
export function encodeVideoId(id: number): string {
  return hashids.encode(id);
}

/**
 * Decode a hash string back to the original video ID
 * @param hash - The encoded hash string
 * @returns The numeric video ID, or null if invalid
 */
export function decodeVideoId(hash: string): number | null {
  const decoded = hashids.decode(hash);
  return decoded.length > 0 ? Number(decoded[0]) : null;
}

/**
 * Build a video page URL with optional progress parameter
 * @param videoId - The video ID (number or encoded string)
 * @param progressSeconds - Optional progress in seconds to start from
 * @returns The video URL string (e.g., "/video?videoId=aBc7Kx9d&progress=120")
 */
export function buildVideoUrl(
  videoId: string | number,
  progressSeconds?: number
): string {
  const encodedId = typeof videoId === 'number' ? encodeVideoId(videoId) : videoId;
  const baseUrl = `/video?videoId=${encodedId}`;

  if (progressSeconds !== undefined && progressSeconds > 0) {
    return `${baseUrl}&progress=${progressSeconds}`;
  }

  return baseUrl;
}
