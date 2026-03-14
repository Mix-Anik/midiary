// ─── Bookmark Groups ──────────────────────────────────────────────────────────

/** Predefined icon identifiers for bookmark groups (Lucide icon names). */
export const BOOKMARK_GROUP_ICONS = [
  'Star', 'Heart', 'Music', 'Mic', 'Flame', 'Trophy',
  'BookOpen', 'Tag', 'Folder', 'Clock', 'Zap', 'Smile',
] as const;

export type BookmarkGroupIcon = typeof BOOKMARK_GROUP_ICONS[number];

export interface BookmarkGroup {
  id: string;
  name: string;
  /** Hex colour string, e.g. "#6366f1" */
  color: string;
  /** Lucide icon name from BOOKMARK_GROUP_ICONS, or null for no icon */
  icon: BookmarkGroupIcon | null;
  createdAt: string;
  updatedAt: string;
  /** Derived via COUNT — not stored as a column */
  sessionCount: number;
  /** Nullable — ready for future multi-user auth */
  userId: string | null;
}

export interface CreateBookmarkGroupDto {
  name: string;
  /** Defaults to '#6366f1' on the backend if omitted */
  color?: string;
  icon?: BookmarkGroupIcon | null;
}

export interface UpdateBookmarkGroupDto {
  name?: string;
  color?: string;
  icon?: BookmarkGroupIcon | null;
}

// ─── Bookmark Entries ─────────────────────────────────────────────────────────

export interface BookmarkEntry {
  id: string;
  bookmarkGroupId: string;
  sessionId: string;
  addedAt: string;
}

export interface AddSessionToGroupDto {
  sessionId: string;
}

// ─── Session bookmark state (used in session list / detail) ──────────────────

/** Minimal group info attached to session cards / detail pages */
export interface SessionBookmarkChip {
  groupId: string;
  name: string;
  color: string;
  icon: BookmarkGroupIcon | null;
}
