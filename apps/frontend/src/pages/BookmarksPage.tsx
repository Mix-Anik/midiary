import { useEffect, useState } from 'react';
import {
  Loader2, Bookmark, Plus, Pencil, Trash2, ChevronRight, ArrowLeft,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { BookmarkGroup, BookmarkGroupIcon, Session } from '@midiary/shared';
import { BOOKMARK_GROUP_ICONS } from '@midiary/shared';
import { bookmarksApi } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { SessionCard } from '../components/SessionCard';
import { BookmarkModal } from '../components/BookmarkModal';

function GroupIcon({ name, size = 16, className = '' }: { name: BookmarkGroupIcon | null; size?: number; className?: string }) {
  if (!name) return null;
  const Icon = (LucideIcons as unknown as Record<string, React.FC<LucideProps>>)[name];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}

interface EditGroupModalProps {
  group: BookmarkGroup | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, name: string, color: string, icon: BookmarkGroupIcon | null) => Promise<void>;
}

function EditGroupModal({ group, open, onClose, onSave }: EditGroupModalProps) {
  const [name, setName] = useState(group?.name ?? '');
  const [color, setColor] = useState(group?.color ?? '#6366f1');
  const [icon, setIcon] = useState<BookmarkGroupIcon | null>((group?.icon as BookmarkGroupIcon | null) ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (group) { setName(group.name); setColor(group.color); setIcon(group.icon as BookmarkGroupIcon | null); }
  }, [group]);

  const handleSave = async () => {
    if (!group || !name.trim()) return;
    setSaving(true);
    try {
      await onSave(group.id, name.trim(), color, icon);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit group" width="sm">
      <div className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex items-start gap-4">
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Colour</p>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-9 h-9 rounded cursor-pointer border border-[var(--border)] p-0.5 bg-transparent"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Icon</p>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setIcon(null)}
                className={[
                  'w-7 h-7 rounded border text-xs flex items-center justify-center transition-colors',
                  icon === null ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)]',
                ].join(' ')}
              >—</button>
              {BOOKMARK_GROUP_ICONS.map((iconName) => {
                const Icon = (LucideIcons as unknown as Record<string, React.FC<LucideProps>>)[iconName];
                if (!Icon) return null;
                return (
                  <button
                    key={iconName}
                    onClick={() => setIcon(iconName)}
                    title={iconName}
                    className={[
                      'w-7 h-7 rounded border flex items-center justify-center transition-colors',
                      icon === iconName ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]',
                    ].join(' ')}
                  >
                    <Icon size={13} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving} disabled={!name.trim()}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

export function BookmarksPage() {
  const [groups, setGroups] = useState<BookmarkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<BookmarkGroup | null>(null);
  const [groupSessions, setGroupSessions] = useState<Session[]>([]);
  const [groupSessionsLoading, setGroupSessionsLoading] = useState(false);
  const [editGroup, setEditGroup] = useState<BookmarkGroup | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<BookmarkGroup | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bookmarkSession, setBookmarkSession] = useState<string | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await bookmarksApi.listGroups();
      setGroups(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const openGroup = async (group: BookmarkGroup) => {
    setSelectedGroup(group);
    setGroupSessionsLoading(true);
    try {
      const sessions = await bookmarksApi.getGroupSessions(group.id);
      setGroupSessions(sessions as Session[]);
    } finally {
      setGroupSessionsLoading(false);
    }
  };

  const handleSaveEdit = async (id: string, name: string, color: string, icon: BookmarkGroupIcon | null) => {
    const updated = await bookmarksApi.updateGroup(id, { name, color, icon });
    setGroups((gs) => gs.map((g) => (g.id === id ? updated : g)));
    if (selectedGroup?.id === id) setSelectedGroup(updated);
  };

  const handleDelete = async () => {
    if (!deleteGroup) return;
    setDeleting(true);
    try {
      await bookmarksApi.deleteGroup(deleteGroup.id);
      setGroups((gs) => gs.filter((g) => g.id !== deleteGroup.id));
      if (selectedGroup?.id === deleteGroup.id) setSelectedGroup(null);
      setDeleteGroup(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-8 py-5 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-3">
          {selectedGroup && (
            <button
              onClick={() => setSelectedGroup(null)}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <h1 className="font-display text-2xl text-[var(--text-primary)]">
              {selectedGroup ? selectedGroup.name : 'Bookmarks'}
            </h1>
            {selectedGroup && (
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {selectedGroup.sessionCount} {selectedGroup.sessionCount === 1 ? 'session' : 'sessions'}
              </p>
            )}
          </div>
        </div>
        {selectedGroup && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditGroup(selectedGroup)}>
              <Pencil size={13} /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteGroup(selectedGroup)}>
              <Trash2 size={13} className="text-[var(--danger)]" />
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        {selectedGroup ? (
          /* Group detail: sessions list */
          groupSessionsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
            </div>
          ) : groupSessions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--text-muted)] text-sm">No sessions in this group yet.</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Add sessions from the session list.</p>
            </div>
          ) : (
            <div className="space-y-2 max-w-3xl">
              {groupSessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={{ ...s, bookmarkChips: [] }}
                  onBookmarkClick={() => setBookmarkSession(s.id)}
                />
              ))}
            </div>
          )
        ) : loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
          </div>
        ) : groups.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mb-4">
              <Bookmark size={24} className="text-[var(--accent)]" />
            </div>
            <h2 className="font-display text-xl text-[var(--text-primary)] mb-2">No bookmark groups</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xs">
              Create a group from any session to organise your practice log.
            </p>
          </div>
        ) : (
          /* Group grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl">
            {groups.map((group) => (
              <div
                key={group.id}
                className="relative bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--border-strong)] hover:shadow-sm transition-all duration-150 cursor-pointer group"
                onClick={() => openGroup(group)}
              >
                {/* Colour accent strip */}
                <div
                  className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
                  style={{ backgroundColor: group.color }}
                />

                <div className="pl-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: group.color }}
                    >
                      <GroupIcon name={group.icon as BookmarkGroupIcon | null} size={15} />
                    </span>
                    <h3 className="font-medium text-[var(--text-primary)] truncate">{group.name}</h3>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {group.sessionCount} {group.sessionCount === 1 ? 'session' : 'sessions'}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditGroup(group); }}
                    className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteGroup(group); }}
                    className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--danger)] transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <ChevronRight size={14} className="absolute right-3 bottom-4 text-[var(--text-muted)] opacity-40 group-hover:opacity-70 transition-opacity" />
              </div>
            ))}
          </div>
        )}
      </main>

      <EditGroupModal
        group={editGroup}
        open={!!editGroup}
        onClose={() => setEditGroup(null)}
        onSave={handleSaveEdit}
      />
      <ConfirmDialog
        open={!!deleteGroup}
        onClose={() => setDeleteGroup(null)}
        onConfirm={handleDelete}
        title="Delete group"
        message={`"${deleteGroup?.name}" will be deleted. Sessions in this group will not be affected.`}
        confirmLabel="Delete group"
        loading={deleting}
      />
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
