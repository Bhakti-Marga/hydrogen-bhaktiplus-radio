/**
 * Prelaunch mode utilities
 * Controls the "pre-launch" period where Lives content is free
 * and payment features show "Coming Soon"
 */

export interface PrelaunchConfig {
  isPrelaunchMode: boolean;
  prelaunchEndDate: Date | null;
  prelaunchEndDateFormatted: string | null;
}

/**
 * Get prelaunch configuration from environment variables
 * Call this server-side in loaders
 */
export function getPrelaunchConfig(env: {
  PRELAUNCH_MODE?: string;
  PRELAUNCH_END_DATE?: string;
}): PrelaunchConfig {
  const isPrelaunchMode = env.PRELAUNCH_MODE === "true";

  let prelaunchEndDate: Date | null = null;
  let prelaunchEndDateFormatted: string | null = null;

  if (env.PRELAUNCH_END_DATE) {
    prelaunchEndDate = new Date(env.PRELAUNCH_END_DATE);
    // Format as "January 15, 2025"
    prelaunchEndDateFormatted = prelaunchEndDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return {
    isPrelaunchMode,
    prelaunchEndDate,
    prelaunchEndDateFormatted,
  };
}

/**
 * Check if prelaunch mode is still active (not past end date)
 */
export function isPrelaunchActive(config: PrelaunchConfig): boolean {
  if (!config.isPrelaunchMode) return false;
  if (!config.prelaunchEndDate) return config.isPrelaunchMode;

  return new Date() < config.prelaunchEndDate;
}

/**
 * Content types that are free during prelaunch
 */
export const PRELAUNCH_FREE_CONTENT_TYPES = ["live"] as const;

/**
 * Check if a content type is free during prelaunch
 */
export function isContentFreeInPrelaunch(contentType: string): boolean {
  return PRELAUNCH_FREE_CONTENT_TYPES.includes(contentType as any);
}
