import { useEffect, useState } from 'react';
import { Plus, Loader2, Music } from 'lucide-react';
import { useSessionsStore } from '../store/sessions';
import { SessionCard } from '../components/SessionCard';
import { BookmarkModal } from '../components/BookmarkModal';
import { UploadModal } from '../components/UploadModal';
import { Button } from '../components/ui/Button';
import { monthGroupKey } from '../utils/format';

export function SessionListPage() {
  const { sessions, isLoading, error, fetchSessions } = useSessionsStore();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [bookmarkSession, setBookmarkSession] = useState<string | null>(null);

  useEffect(() => {
    if (sessions.length === 0) fetchSessions();
  }, [fetchSessions, sessions.length]);

  // Group sessions by month
  const grouped = sessions.reduce<Record<string, typeof sessions>>(
    (acc, s) => {
      const key = monthGroupKey(s.recordedAt);
      return { ...acc, [key]: [...(acc[key] ?? []), s] };
    },
    {},
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div>
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Sessions</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {sessions.length > 0
              ? `${sessions.length} session${sessions.length === 1 ? '' : 's'}`
              : 'Your practice log'}
          </p>
        </div>
        <Button variant="primary" onClick={() => setUploadOpen(true)}>
          <Plus size={15} />
          New session
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
        {isLoading && sessions.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-[var(--danger)] text-sm mb-3">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchSessions}>Retry</Button>
          </div>
        ) : sessions.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mb-4">
              <Music size={28} className="text-[var(--accent)]" />
            </div>
            <h2 className="font-display text-xl text-[var(--text-primary)] mb-2">No sessions yet</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xs mb-6">
              Upload your first MIDI recording and audio file to start your practice log.
            </p>
            <Button variant="primary" onClick={() => setUploadOpen(true)}>
              <Plus size={15} />
              Upload a session
            </Button>
          </div>
        ) : (
          <div className="space-y-8 max-w-3xl">
            {Object.entries(grouped).map(([month, monthSessions]) => (
              <section key={month}>
                <h2 className="font-display text-sm font-medium text-[var(--text-muted)] tracking-widest uppercase mb-3">
                  {month}
                </h2>
                <div className="space-y-2">
                  {monthSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onBookmarkClick={() => setBookmarkSession(session.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      {bookmarkSession && (
        <BookmarkModal
          open={true}
          onClose={() => setBookmarkSession(null)}
          sessionId={bookmarkSession}
        />
      )}
    </div>
  );
}
