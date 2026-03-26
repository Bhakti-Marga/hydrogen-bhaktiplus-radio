/**
 * Image optimization utilities for srcset generation.
 *
 * Uses API-provided thumbnail variants (thumbnailUrlVariants) for srcset.
 * The API returns pre-computed WebP variants at multiple widths as a JSON string.
 */

import type { ThumbnailVariants } from "~/lib/api/types";

/**
 * Generate srcset string from API-provided thumbnail variants JSON string.
 * Parses the JSON and includes original as largest option for fallback.
 *
 * IMPORTANT: Only uses variants if the originalUrl in variants matches the
 * provided thumbnailUrl. This prevents using stale/mismatched variant data.
 *
 * @param variantsJson - JSON string from API (thumbnailUrlVariants field)
 * @param thumbnailUrl - The current thumbnail URL to validate against
 * @returns srcset string, or empty string if invalid/empty/mismatched
 *
 * @example
 * getSrcSetFromVariants('{"originalUrl": "...", "variants": [{ "width": 160, "url": "..." }, ...]}', 'https://...')
 * // Returns: "https://.../resized/thumb-160w.webp 160w, ..., https://.../original/thumb.jpg 1280w"
 */
export function getSrcSetFromVariants(variantsJson: string | null | undefined, thumbnailUrl?: string | null): string {
  if (!variantsJson) {
    return "";
  }

  try {
    const variants = JSON.parse(variantsJson) as ThumbnailVariants;

    if (!variants?.variants || variants.variants.length === 0) {
      return "";
    }

    // Only use variants if originalUrl matches the current thumbnailUrl
    // This prevents using stale variant data when the thumbnail has changed
    if (thumbnailUrl && variants.originalUrl !== thumbnailUrl) {
      return "";
    }

    const variantSrcSet = variants.variants
      .map((v) => `${v.url} ${v.width}w`)
      .join(", ");

    // Add original as largest option (fallback if resized don't exist)
    return `${variantSrcSet}, ${variants.originalUrl} 1280w`;
  } catch {
    return "";
  }
}

/**
 * Default sizes attribute for card thumbnails.
 *
 * Based on card size CSS variables:
 * - xxs: 158px, xs: 226px, sm: 256px, md: 300px, lg: 318px
 *
 * With 2x DPR consideration, we use:
 * - Mobile (<640px): 320px cards displayed, need 640w for 2x
 * - Tablet/Desktop: up to 318px cards, need 640w for 2x
 */
export const THUMBNAIL_SIZES = "(max-width: 640px) 50vw, 320px";

/**
 * Get sizes attribute based on card size.
 *
 * @param cardSize - Card size variant
 * @returns Appropriate sizes attribute
 */
export function getThumbnailSizes(cardSize: "auto" | "xxs" | "xs" | "sm" | "md" | "lg" = "auto"): string {
  // Map card sizes to approximate pixel widths (with 2x DPR buffer)
  const sizeMap: Record<string, string> = {
    auto: "(max-width: 640px) 50vw, 320px",
    xxs: "160px", // 158px display, 316px for 2x → 320w sufficient
    xs: "240px", // 226px display, 452px for 2x → 480w sufficient
    sm: "256px", // 256px display, 512px for 2x → 640w sufficient
    md: "320px", // 300px display, 600px for 2x → 640w sufficient
    lg: "320px", // 318px display, 636px for 2x → 640w sufficient
  };

  return sizeMap[cardSize] || sizeMap.auto;
}
