import type { SessionBookmarkChip } from './bookmark.js';

// ─── Session ─────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  title: string;
  description: string | null;
  /** ISO 8601 timestamp — the actual date/time of the practice session */
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
  /** Stored filename on disk (not the original upload name) */
  midiFilename: string;
  /** Stored filename on disk (not the original upload name) */
  audioFilename: string;
  /** Duration in milliseconds parsed from MIDI on upload; null if not yet parsed */
  durationMs: number | null;
  /** Nullable — ready for future multi-user auth; always null in single-user mode */
  userId: string | null;
}

export interface CreateSessionDto {
  title: string;
  description?: string;
  /** ISO 8601 date string for when the session was recorded */
  recordedAt: string;
  // midi and audio are uploaded as multipart/form-data fields — not in this DTO
}

export interface UpdateSessionDto {
  title?: string;
  description?: string;
  /** ISO 8601 date string */
  recordedAt?: string;
}

/**
 * Session enriched with bookmark chip data.
 * Returned by GET /sessions and GET /sessions/:id so the frontend
 * can show group indicators without a separate API call.
 */
export interface SessionWithBookmarkChips extends Session {
  bookmarkChips: SessionBookmarkChip[];
}

// ─── App Preferences ─────────────────────────────────────────────────────────

export interface AppPreferences {
  id: string;
  theme: 'light' | 'dark';
  /** Nullable — ready for future multi-user auth */
  userId: string | null;
}

export interface UpdateAppPreferencesDto {
  theme?: 'light' | 'dark';
}

// ─── Health check ─────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok' | 'degraded';
  version: string;
  db: 'connected' | 'error';
}
