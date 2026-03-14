/**
 * Session detail page — shows the audio player, timeline bar, piano roll,
 * and plugin-injected widgets for a single session.
 *
 * The piano roll canvas rendering is implemented in Phase 5.
 * This page sets up the layout and wires up all surrounding components.
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Bookmark, Pencil, Check, X, Loader2, Trash2 } from 'lucide-react';
import type { SessionWithBookmarkChips } from '@midiary/shared';
import { useSessionsStore } from '../store/sessions';
import { AudioPlayer } from '../components/AudioPlayer';
import { ConnectedTimelineBar } from '../components/TimelineBar';
import { BookmarkModal } from '../components/BookmarkModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { sessionsApi } from '../api/client';
import { formatDate } from '../utils/format';
import { getRegisteredPlugins } from '../plugins/registry';
import type { SessionWidgetProps, PianoRollOverlayProps } from '@midiary/shared';
import { usePlayerStore } from '../store/player';

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sessions, fetchSession, updateSession, deleteSession } = useSessionsStore();

  const [session, setSession] = useState<SessionWithBookmarkChips | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Inline editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Load session
  useEffect(() => {
    if (!id) return;
    const cached = sessions.find((s) => s.id === id);
    if (cached) { setSession(cached); setLoading(false); return; }
    fetchSession(id)
      .then(setSession)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, fetchSession, navigate, sessions]);

  // Sync from store changes (e.g. bookmark updates)
  useEffect(() => {
    if (!id) return;
    const s = sessions.find((x) => x.id === id);
    if (s) setSession(s);
  }, [sessions, id]);

  const startEditTitle = () => {
    if (!session) return;
    setEditTitle(session.title);
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 0);
  };

  const saveTitle = async () => {
    if (!id || !session || !editTitle.trim()) return;
    setEditingTitle(false);
    if (editTitle.trim() === session.title) return;
    await updateSession(id, { title: editTitle.trim() });
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteSession(id);
      navigate('/');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (!session) return null;

  const audioSrc = sessionsApi.audioUrl(session.id);
  const plugins = getRegisteredPlugins();

  // Piano roll overlay props (placeholder values — Phase 5 fills in real canvas dims)
  const overlayProps: PianoRollOverlayProps = {
    currentTime: 0,
    duration: session.durationMs ? session.durationMs / 1000 : 0,
    canvasWidth: 0,
    canvasHeight: 0,
    pitchToX: (midi) => midi,
    timeToY: (_secs, _cur, _h) => 0,
  };

  const sidebarWidgetProps: SessionWidgetProps = { sessionId: session.id, session };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">
        <Link
          to="/"
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>

        {/* Title */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {editingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                ref={titleInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle();
                  if (e.key === 'Escape') setEditingTitle(false);
                }}
                onBlur={saveTitle}
                className="flex-1 font-display text-xl bg-transparent border-b border-[var(--accent)] outline-none text-[var(--text-primary)]"
              />
              <button onClick={saveTitle} className="p-1 text-[var(--success)]"><Check size={15} /></button>
              <button onClick={() => setEditingTitle(false)} className="p-1 text-[var(--text-muted)]"><X size={15} /></button>
            </div>
          ) : (
            <button
              onClick={startEditTitle}
              className="group flex items-center gap-2 text-left min-w-0"
            >
              <h1 className="font-display text-xl text-[var(--text-primary)] truncate">{session.title}</h1>
              <Pencil size={13} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm text-[var(--text-muted)]">{formatDate(session.recordedAt)}</span>
          <button
            onClick={() => setBookmarkOpen(true)}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Manage bookmarks"
          >
            <Bookmark
              size={16}
              fill={session.bookmarkChips.length > 0 ? 'currentColor' : 'none'}
              className={session.bookmarkChips.length > 0 ? 'text-[var(--accent)]' : ''}
            />
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--danger)] transition-colors"
            aria-label="Delete session"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* Bookmark chips */}
      {session.bookmarkChips.length > 0 && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">
          {session.bookmarkChips.map((chip) => (
            <Badge
              key={chip.groupId}
              color={chip.color}
              onClick={() => setBookmarkOpen(true)}
            >
              {chip.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Main layout: piano roll area + sidebar widgets */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Piano roll column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Audio player */}
          <div className="px-4 pt-4 flex-shrink-0">
            <AudioPlayer sessionId={session.id} audioSrc={audioSrc} />
          </div>

          {/* Timeline bar */}
          <div className="px-4 flex-shrink-0">
            <TimelineBarWithPlugins session={session} />
          </div>

          {/* Piano roll canvas — filled in Phase 5 */}
          <div className="flex-1 min-h-0 px-4 pb-4 pt-0">
            <PianoRollArea
              sessionId={session.id}
              pluginOverlays={plugins
                .filter((p) => p.PianoRollOverlay)
                .map((p) => {
                  const Overlay = p.PianoRollOverlay as React.FC<PianoRollOverlayProps>;
                  return <Overlay key={p.manifest.id} {...overlayProps} />;
                })}
            />
          </div>
        </div>

        {/* Sidebar: plugin widgets */}
        {plugins.some((p) => p.SessionSidebarWidget) && (
          <aside className="w-64 flex-shrink-0 border-l border-[var(--border)] overflow-y-auto px-4 py-4 space-y-4">
            {plugins
              .filter((p) => p.SessionSidebarWidget)
              .map((p) => {
                const Widget = p.SessionSidebarWidget as React.FC<SessionWidgetProps>;
                return <Widget key={p.manifest.id} {...sidebarWidgetProps} />;
              })}
          </aside>
        )}
      </div>

      {/* Modals */}
      <BookmarkModal
        open={bookmarkOpen}
        onClose={() => setBookmarkOpen(false)}
        sessionId={session.id}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete session"
        message="This will permanently delete the session and its associated files. This action cannot be undone."
        confirmLabel="Delete session"
        loading={deleting}
      />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TimelineBarWithPlugins({ session }: { session: SessionWithBookmarkChips }) {
  const plugins = getRegisteredPlugins();
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);

  const markers = plugins
    .filter((p) => p.TimelineMarker)
    .map((p) => {
      const Marker = p.TimelineMarker as React.FC<import('@midiary/shared').TimelineMarkerProps>;
      // Example: render at time 0 as placeholder; real plugins supply their own timestamp
      return (
        <Marker
          key={p.manifest.id}
          timestamp={0}
          currentTime={currentTime}
          duration={duration}
          containerWidth={0}
        />
      );
    });

  return <ConnectedTimelineBar markers={markers.length > 0 ? <>{markers}</> : undefined} />;
}

/** Placeholder for the piano roll canvas — fully implemented in Phase 5. */
function PianoRollArea({
  sessionId,
  pluginOverlays,
}: {
  sessionId: string;
  pluginOverlays: React.ReactNode[];
}) {
  return (
    <div
      id={`piano-roll-${sessionId}`}
      className="relative w-full h-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg overflow-hidden"
      aria-label="Piano roll visualisation"
    >
      {/* Phase 5: PianoRoll canvas component rendered here */}
      <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] text-sm select-none">
        <span>Piano roll — implemented in Phase 5</span>
      </div>

      {/* Plugin overlay layer (absolute, on top of canvas) */}
      <div className="absolute inset-0 pointer-events-none">
        {pluginOverlays}
      </div>
    </div>
  );
}
