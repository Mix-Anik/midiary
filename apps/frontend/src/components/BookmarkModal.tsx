import { useState, useEffect } from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';
import type { BookmarkGroup } from '@midiary/shared';
import { bookmarksApi } from '../api/client';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useSessionsStore } from '../store/sessions';
import { BOOKMARK_GROUP_ICONS, type BookmarkGroupIcon } from '@midiary/shared';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface BookmarkModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
}

function GroupIcon({ name, size = 14 }: { name: BookmarkGroupIcon | null; size?: number }) {
  if (!name) return null;
  const Icon = (LucideIcons as unknown as Record<string, React.FC<LucideProps>>)[name];
  if (!Icon) return null;
  return <Icon size={size} />;
}

export function BookmarkModal({ open, onClose, sessionId }: BookmarkModalProps) {
  const [groups, setGroups] = useState<BookmarkGroup[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [newIcon, setNewIcon] = useState<BookmarkGroupIcon | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const patchLocalBookmarkChips = useSessionsStore((s) => s.patchLocalBookmarkChips);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      bookmarksApi.listGroups(),
      bookmarksApi.getSessionGroups(sessionId),
    ]).then(([all, mine]) => {
      setGroups(all);
      setMemberIds(new Set(mine.map((g) => g.id)));
    }).finally(() => setLoading(false));
  }, [open, sessionId]);

  const toggle = async (groupId: string) => {
    const isMember = memberIds.has(groupId);
    setToggling((s) => new Set(s).add(groupId));

    try {
      if (isMember) {
        await bookmarksApi.removeSessionFromGroup(groupId, sessionId);
        setMemberIds((s) => { const n = new Set(s); n.delete(groupId); return n; });
      } else {
        await bookmarksApi.addSessionToGroup(groupId, sessionId);
        setMemberIds((s) => new Set(s).add(groupId));
      }
      // Refresh chips in session list
      const updated = await bookmarksApi.getSessionGroups(sessionId);
      patchLocalBookmarkChips(
        sessionId,
        updated.map((g) => ({ groupId: g.id, name: g.name, color: g.color, icon: g.icon })),
      );
    } finally {
      setToggling((s) => { const n = new Set(s); n.delete(groupId); return n; });
    }
  };

  const createAndAdd = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const group = await bookmarksApi.createGroup({
        name: newName.trim(),
        color: newColor,
        icon: newIcon,
      });
      await bookmarksApi.addSessionToGroup(group.id, sessionId);
      setGroups((gs) => [...gs, { ...group, sessionCount: 1 }]);
      setMemberIds((s) => new Set(s).add(group.id));
      setNewName('');
      setNewColor('#6366f1');
      setNewIcon(null);
      setShowCreate(false);
      // refresh chips
      const updated = await bookmarksApi.getSessionGroups(sessionId);
      patchLocalBookmarkChips(
        sessionId,
        updated.map((g) => ({ groupId: g.id, name: g.name, color: g.color, icon: g.icon })),
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Bookmark session" width="sm">
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
        </div>
      ) : (
        <div className="space-y-1 mt-1">
          {groups.length === 0 && !showCreate && (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No bookmark groups yet.
            </p>
          )}

          {groups.map((group) => {
            const isMember = memberIds.has(group.id);
            const isToggling = toggling.has(group.id);
            return (
              <button
                key={group.id}
                onClick={() => toggle(group.id)}
                disabled={isToggling}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors duration-100 disabled:opacity-60"
              >
                {/* Colour swatch + icon */}
                <span
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-white"
                  style={{ backgroundColor: group.color }}
                >
                  <GroupIcon name={group.icon as BookmarkGroupIcon | null} size={14} />
                </span>

                <span className="flex-1 text-left">
                  <span className="font-medium">{group.name}</span>
                  <span className="ml-2 text-xs text-[var(--text-muted)]">
                    {group.sessionCount} {group.sessionCount === 1 ? 'session' : 'sessions'}
                  </span>
                </span>

                {isToggling ? (
                  <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
                ) : isMember ? (
                  <Check size={15} className="text-[var(--accent)]" />
                ) : null}
              </button>
            );
          })}

          {/* Create new group */}
          {showCreate ? (
            <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-3">
              <Input
                label="Group name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Technique exercises"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') createAndAdd(); }}
              />

              {/* Color + icon row */}
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Colour</p>
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-[var(--border)] p-0.5 bg-transparent"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Icon</p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setNewIcon(null)}
                      className={[
                        'w-7 h-7 rounded flex items-center justify-center text-xs border transition-colors',
                        newIcon === null ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]',
                      ].join(' ')}
                    >—</button>
                    {BOOKMARK_GROUP_ICONS.map((iconName) => {
                      const Icon = (LucideIcons as unknown as Record<string, React.FC<LucideProps>>)[iconName];
                      if (!Icon) return null;
                      return (
                        <button
                          key={iconName}
                          onClick={() => setNewIcon(iconName)}
                          title={iconName}
                          className={[
                            'w-7 h-7 rounded flex items-center justify-center border transition-colors',
                            newIcon === iconName ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]',
                          ].join(' ')}
                        >
                          <Icon size={13} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={createAndAdd} loading={creating} disabled={!newName.trim()}>
                  Create & add
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors mt-1 border-t border-[var(--border)] pt-3"
            >
              <Plus size={14} />
              New group
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
