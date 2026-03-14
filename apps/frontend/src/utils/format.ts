/**
 * Format seconds as MM:SS.mmm (e.g. 00:42.350).
 * Used for the timeline bar time display and audio player.
 */
export function formatTimestamp(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '00:00.000';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

/**
 * Format seconds as MM:SS (no milliseconds) for compact display.
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Format milliseconds as a human-readable duration (e.g. "3m 42s", "58s").
 */
export function formatDurationMs(ms: number | null): string {
  if (ms == null || ms <= 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

/**
 * Format a date string as a long readable date (e.g. "14 March 2026").
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format a date string as a short date (e.g. "14 Mar 2026").
 */
export function formatDateShort(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Return the month-year key for grouping sessions (e.g. "March 2026").
 */
export function monthGroupKey(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format a date for <input type="datetime-local"> value.
 */
export function toDatetimeLocalValue(isoString: string): string {
  // datetime-local requires YYYY-MM-DDTHH:mm
  return isoString.slice(0, 16);
}

/**
 * Parse a datetime-local string to ISO.
 */
export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}
