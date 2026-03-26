import type {
  Live,
  Satsang,
  SatsangCategory,
  Commentary,
  Pilgrimage,
  Talk,
} from "~/lib/types";
import type { ContentNewStatusResponseDto } from "~/lib/api/types";

// ============================================================
// HEADER NAVIGATION
// Clean separation: static structure + deferred submenu data
// ============================================================

/**
 * Props for Header component.
 *
 * - nav: Static navigation structure (links only, no data)
 * - submenuData: Deferred data for mega-menu dropdowns (null for unsubscribed users)
 * - contentNewStatus: Content new status for NEW badge display (loaded in critical path)
 */
export interface HeaderProps {
  onSearch?: (query: string) => void;
  nav: HeaderNav;
  submenuData: Promise<HeaderSubmenuData | null> | null;
  contentNewStatus?: ContentNewStatusResponseDto | null;
}

/**
 * Static navigation structure.
 * Contains only link metadata - no async data.
 */
export interface HeaderNav {
  links: HeaderLink[];
}

/**
 * Individual navigation link.
 * No submenu attached - submenu data is separate.
 */
export interface HeaderLink {
  name: string;
  link: string;
  id: string;
}

// ============================================================
// SUBMENU DATA TYPES
// ============================================================

/**
 * All submenu data, keyed by link ID.
 * Loaded as a single deferred promise for subscribed users.
 */
export interface HeaderSubmenuData {
  lives: LivesSubmenuData;
  satsangs: SatsangsSubmenuData;
  commentaries: CommentariesSubmenuData;
  pilgrimages: PilgrimagesSubmenuData;
  talks: TalksSubmenuData;
}

export interface LivesSubmenuData {
  type: "lives";
  latestLives: Live[];
  /** True if any content in this submenu has isNew=true */
  hasNewContent: boolean;
  /** True if any content in this submenu has isUpcoming=true */
  hasUpcomingContent: boolean;
}

export interface SatsangsSubmenuData {
  type: "satsangs";
  categories: SatsangCategory[];
  latestReleases: Satsang[];
  /** True if any content in this submenu has isNew=true */
  hasNewContent: boolean;
  /** True if any content in this submenu has isUpcoming=true */
  hasUpcomingContent: boolean;
}

export interface CommentariesSubmenuData {
  type: "commentaries";
  publicCommentaries: Commentary[];
  exclusiveCommentaries: Commentary[];
  /** True if any content in this submenu has isNew=true */
  hasNewContent: boolean;
  /** True if any content in this submenu has isUpcoming=true */
  hasUpcomingContent: boolean;
}

export interface PilgrimagesSubmenuData {
  type: "pilgrimages";
  pilgrimages: Pilgrimage[];
  /** True if any content in this submenu has isNew=true */
  hasNewContent: boolean;
  /** True if any content in this submenu has isUpcoming=true */
  hasUpcomingContent: boolean;
}

export interface TalksSubmenuData {
  type: "talks";
  latestTalks: Talk[];
  /** True if any content in this submenu has isNew=true */
  hasNewContent: boolean;
  /** True if any content in this submenu has isUpcoming=true */
  hasUpcomingContent: boolean;
}

// Union type for any specific submenu
export type SpecificSubmenuData =
  | LivesSubmenuData
  | SatsangsSubmenuData
  | CommentariesSubmenuData
  | PilgrimagesSubmenuData
  | TalksSubmenuData;

// ============================================================
// LEGACY TYPES (can be removed after migration)
// ============================================================

export interface SearchHistory {
  items: {
    query: string;
  }[];
}
