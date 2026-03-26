import { format, intervalToDuration } from "date-fns";

export function isPromise(value: unknown): value is Promise<unknown> {
  return typeof value === "object" && value !== null && "then" in value;
}

/**
 * Returns shopify asset id from global id (gid)
 * "gid://shopify/Collection/426224943408" -> "426224943408"
 * Note: Returns string to avoid bigint truncation for large Shopify IDs
 */
export function parseShopifyGidToId(gid?: string): string {
  const regex = /\/[0-9]+$/;
  const id = gid?.match(regex);

  if (!id) {
    throw new Error(`Error parsing shopify gid to id. gid: ${gid}`);
  }

  return id[0].substring(1);
}

export const formatTimestamp = (seconds: number): string => {
  // @ts-expect-error - Date constructor accepts null
  const date = new Date(null);
  date.setSeconds(seconds);
  return date.toISOString().slice(11, 19);
};

export const formatVideoDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) {
    return "0:00";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  // Format seconds with leading zero
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

  if (hours > 0) {
    // Format: "1:05:30" (with leading zero for minutes when hours present)
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${hours}:${formattedMinutes}:${formattedSeconds}`;
  } else {
    // Format: "5:30" (no leading zero for minutes when no hours)
    return `${minutes}:${formattedSeconds}`;
  }
};

/**
 * Format seconds to human-readable duration (e.g., "2h 30m" or "45m")
 * Used for displaying content duration in a readable format.
 */
export const formatDurationHuman = (seconds: number): string => {
  if (!seconds || seconds < 0) {
    return "";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
  }
  return `${minutes}m`;
};

/**
 * Converts HTML entities and <br> tags to plain text equivalents.
 * Useful for processing translation strings that may contain HTML markup.
 * 
 * - Converts <br>, <br/>, <br /> to newlines
 * - Decodes common HTML entities (&apos;, &quot;, &amp;, &lt;, &gt;, &nbsp;)
 */
/**
 * Strips HTML tags from a string, returning plain text.
 * Also decodes common HTML entities.
 */
export const stripHtml = (html: string): string => {
  if (!html) return html;
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
};

export const decodeHtmlEntities = (text: string): string => {
  if (!text) return text;
  
  return text
    // Convert <br> variants to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    // Decode common HTML entities
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
};