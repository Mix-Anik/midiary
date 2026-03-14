/**
 * TimelineBar — a dedicated scrub bar between the audio player and piano roll.
 *
 * - Full-width horizontal track with a draggable needle showing current position
 * - Time display in MM:SS.mmm format, updated via requestAnimationFrame
 * - Keyboard accessible (Left/Right arrow keys nudge ±1s, Shift+arrow ±5s)
 * - Plugin injection slot: TimelineMarker components rendered inside the track
 *
 * Note: The interactive playback cursor lives here; the piano roll canvas only
 * has a static "now" reference line at its top edge.
 */
import { useRef, useCallback, useEffect, type ReactNode } from 'react';
import { usePlayerStore } from '../store/player';
import { formatTimestamp } from '../utils/format';

interface TimelineBarProps {
  duration: number;
  currentTime: number;
  onScrub: (seconds: number) => void;
  /** Plugin-injected marker elements */
  markers?: ReactNode;
}

export function TimelineBar({ duration, currentTime, onScrub, markers }: TimelineBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const positionFromEvent = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track || duration <= 0) return 0;
      const { left, width } = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
      return ratio * duration;
    },
    [duration],
  );

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      onScrub(positionFromEvent(e.clientX));

      const onMove = (ev: MouseEvent) => {
        if (dragging.current) onScrub(positionFromEvent(ev.clientX));
      };
      const onUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [onScrub, positionFromEvent],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 5 : 1;
      if (e.key === 'ArrowRight') { e.preventDefault(); onScrub(Math.min(currentTime + step, duration)); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); onScrub(Math.max(currentTime - step, 0)); }
    },
    [currentTime, duration, onScrub],
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 select-none bg-[var(--bg-elevated)] border-x border-b border-[var(--border)] rounded-b-lg">
      {/* Track */}
      <div
        ref={trackRef}
        role="slider"
        aria-label="Playback position"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-valuetext={formatTimestamp(currentTime)}
        tabIndex={0}
        onMouseDown={startDrag}
        onKeyDown={handleKeyDown}
        className="relative flex-1 h-6 flex items-center cursor-pointer group focus:outline-none"
      >
        {/* Track background */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-[var(--border-strong)] rounded-full overflow-hidden">
          {/* Filled portion */}
          <div
            className="absolute left-0 top-0 h-full bg-[var(--accent)] rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Plugin markers */}
        {markers}

        {/* Needle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--accent)] shadow-md ring-2 ring-[var(--bg-surface)] transition-none group-focus:ring-[var(--accent)] pointer-events-none"
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* Time display */}
      <div className="flex-shrink-0 text-right">
        <span
          className="text-xs tabular-nums text-[var(--text-secondary)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {formatTimestamp(currentTime)}
        </span>
        {duration > 0 && (
          <span
            className="text-xs tabular-nums text-[var(--text-muted)] ml-1"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            / {formatTimestamp(duration)}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Connected TimelineBar — reads from the player store and wires up onScrub.
 * Use this in SessionDetailPage instead of TimelineBar directly.
 */
export function ConnectedTimelineBar({ markers }: { markers?: ReactNode }) {
  const { currentTime, duration, seek } = usePlayerStore((s) => ({
    currentTime: s.currentTime,
    duration: s.duration,
    seek: s.seek,
  }));

  return (
    <TimelineBar
      currentTime={currentTime}
      duration={duration}
      onScrub={seek}
      markers={markers}
    />
  );
}
