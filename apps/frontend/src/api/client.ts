import type {
  Session,
  SessionWithBookmarkChips,
  CreateSessionDto,
  UpdateSessionDto,
  BookmarkGroup,
  CreateBookmarkGroupDto,
  UpdateBookmarkGroupDto,
  PluginWithState,
  UpdatePluginPreferenceDto,
  HealthResponse,
} from '@midiary/shared';

const BASE = '/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, (body as { error?: string }).error ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessionsApi = {
  list: () => request<SessionWithBookmarkChips[]>('/sessions'),

  get: (id: string) => request<SessionWithBookmarkChips>(`/sessions/${id}`),

  create: (dto: CreateSessionDto, midi: File, audio: File) => {
    const form = new FormData();
    form.append('title', dto.title);
    form.append('recordedAt', dto.recordedAt);
    if (dto.description) form.append('description', dto.description);
    form.append('midi', midi);
    form.append('audio', audio);
    return request<SessionWithBookmarkChips>('/sessions', {
      method: 'POST',
      headers: {},        // let browser set multipart boundary
      body: form,
    });
  },

  update: (id: string, dto: UpdateSessionDto) =>
    request<SessionWithBookmarkChips>(`/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  delete: (id: string) => request<void>(`/sessions/${id}`, { method: 'DELETE' }),

  midiUrl: (id: string) => `${BASE}/sessions/${id}/midi`,
  audioUrl: (id: string) => `${BASE}/sessions/${id}/audio`,
} as const;

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export const bookmarksApi = {
  listGroups: () => request<BookmarkGroup[]>('/bookmark-groups'),

  createGroup: (dto: CreateBookmarkGroupDto) =>
    request<BookmarkGroup>('/bookmark-groups', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateGroup: (id: string, dto: UpdateBookmarkGroupDto) =>
    request<BookmarkGroup>(`/bookmark-groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deleteGroup: (id: string) =>
    request<void>(`/bookmark-groups/${id}`, { method: 'DELETE' }),

  getGroupSessions: (groupId: string) =>
    request<Session[]>(`/bookmark-groups/${groupId}/sessions`),

  addSessionToGroup: (groupId: string, sessionId: string) =>
    request<void>(`/bookmark-groups/${groupId}/sessions`, {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  removeSessionFromGroup: (groupId: string, sessionId: string) =>
    request<void>(`/bookmark-groups/${groupId}/sessions/${sessionId}`, {
      method: 'DELETE',
    }),

  getSessionGroups: (sessionId: string) =>
    request<BookmarkGroup[]>(`/sessions/${sessionId}/bookmark-groups`),
} as const;

// ─── Plugins ──────────────────────────────────────────────────────────────────

export const pluginsApi = {
  list: () => request<PluginWithState[]>('/plugins'),

  update: (pluginId: string, dto: UpdatePluginPreferenceDto) =>
    request<PluginWithState>(`/plugins/${pluginId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
} as const;

// ─── Health ───────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => request<HealthResponse>('/health'),
} as const;
