/**
 * ID of the portal element where mega menu submenus are rendered.
 *
 * Used in:
 * - Header.tsx: Creates the portal target div
 * - HeaderNav.tsx: Finds the portal target for createPortal()
 * - HeaderNav.tsx: Checks if focus is moving to submenu (for onBlur keyboard navigation)
 *
 * IMPORTANT: The submenu is portaled outside the normal nav DOM tree for proper
 * full-width positioning. This means accessibility checks (like onBlur contains())
 * must reference this portal ID instead of checking DOM hierarchy.
 */
export const MEGA_MENU_PORTAL_ID = 'mega-menu-portal';

/**
 * Map nav link names (from server data) to translation keys.
 * Used in HeaderNav and MobileNav to display translated nav labels.
 */
export const NAV_LINK_LABELS: Record<string, keyof typeof import('~/lib/translations/keys').TRANSLATION_KEYS> = {
  'Livestreams': 'nav_livestreams',
  'Satsangs': 'nav_satsangs',
  'Commentaries': 'nav_commentaries',
  'Virtual Pilgrimages': 'nav_virtual_pilgrimages',
  'Talks': 'nav_talks',
};
