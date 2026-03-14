import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import type { SessionWithBookmarkChips } from '@midiary/shared';
import { formatDateShort, formatDurationMs } from '../utils/format';

interface SessionCardProps {
  session: SessionWithBookmarkChips;
  onBookmarkClick: (e: React.MouseEvent) => void;
}

export function SessionCard({ session, onBookmarkClick }: SessionCardProps) {
  const navigate = useNavigate();
  const hasBookmarks = session.bookmarkChips.length > 0;

  return (
    <article
      onClick={() => navigate(`/sessions/${session.id}`)}
      className="group relative flex items-start gap-4 px-5 py-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg cursor-pointer transition-all duration-150 hover:border-[var(--border-strong)] hover:shadow-sm"
    >
      {/* Date column */}
      <div className="flex-shrink-0 w-14 text-right pt-0.5">
        <p
          className="text-xs text-[var(--text-muted)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {new Date(session.recordedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </p>
      </div>

      {/* Vertical divider */}
      <div className="w-px self-stretch bg-[var(--border)] flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-base font-medium text-[var(--text-primary)] truncate leading-snug">
          {session.title}
        </h3>

        {session.description && (
          <p className="mt-0.5 text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">
            {session.description}
          </p>
        )}

        <div className="mt-2.5 flex items-center gap-3">
          {/* Duration */}
          <span
            className="text-xs text-[var(--text-muted)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {formatDurationMs(session.durationMs)}
          </span>

          {/* Bookmark chips */}
          {hasBookmarks && (
            <div className="flex items-center gap-1.5">
              {session.bookmarkChips.map((chip) => (
                <span
                  key={chip.groupId}
                  title={chip.name}
                  className="inline-block w-2 h-2 rounded-full ring-1 ring-white ring-offset-1 ring-offset-[var(--bg-surface)]"
                  style={{ backgroundColor: chip.color }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bookmark button */}
      <button
        onClick={(e) => { e.stopPropagation(); onBookmarkClick(e); }}
        aria-label="Manage bookmarks"
        className={[
          'flex-shrink-0 self-center p-1.5 rounded-md transition-all duration-150',
          'opacity-0 group-hover:opacity-100 focus:opacity-100',
          hasBookmarks
            ? 'text-[var(--accent)] opacity-100'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
        ].join(' ')}
      >
        <Bookmark size={15} fill={hasBookmarks ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}
