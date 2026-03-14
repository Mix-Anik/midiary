import { create } from 'zustand';
import type { SessionWithBookmarkChips, UpdateSessionDto } from '@midiary/shared';
import { sessionsApi } from '../api/client';

interface SessionsState {
  sessions: SessionWithBookmarkChips[];
  isLoading: boolean;
  error: string | null;

  fetchSessions: () => Promise<void>;
  fetchSession: (id: string) => Promise<SessionWithBookmarkChips>;
  updateSession: (id: string, dto: UpdateSessionDto) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  /** Patch bookmark chips for a session in the local store (no re-fetch needed). */
  patchLocalBookmarkChips: (sessionId: string, chips: SessionWithBookmarkChips['bookmarkChips']) => void;
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [],
  isLoading: false,
  error: null,

  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await sessionsApi.list();
      set({ sessions: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchSession: async (id) => {
    const data = await sessionsApi.get(id);
    // Upsert into local list
    set((s) => {
      const exists = s.sessions.some((x) => x.id === id);
      const sessions = exists
        ? s.sessions.map((x) => (x.id === id ? data : x))
        : [...s.sessions, data];
      return { sessions };
    });
    return data;
  },

  updateSession: async (id, dto) => {
    const updated = await sessionsApi.update(id, dto);
    set((s) => ({
      sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...updated } : x)),
    }));
  },

  deleteSession: async (id) => {
    await sessionsApi.delete(id);
    set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) }));
  },

  patchLocalBookmarkChips: (sessionId, chips) => {
    set((s) => ({
      sessions: s.sessions.map((x) =>
        x.id === sessionId ? { ...x, bookmarkChips: chips } : x,
      ),
    }));
  },
}));
