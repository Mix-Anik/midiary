import { eq, sql, and, inArray } from 'drizzle-orm';
import type {
  BookmarkGroup,
  CreateBookmarkGroupDto,
  UpdateBookmarkGroupDto,
  BookmarkGroupIcon,
} from '@midiary/shared';
import type { Session } from '@midiary/shared';
import { db } from '../db/client';
import { bookmarkGroups, bookmarkEntries, sessions } from '../db/schema';
import { HttpError } from '../middleware/error';

// ─── Type mapping ─────────────────────────────────────────────────────────────

type GroupRow = typeof bookmarkGroups.$inferSelect;

function mapGroupRow(row: GroupRow, sessionCount: number): BookmarkGroup {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: (row.icon ?? null) as BookmarkGroupIcon | null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    sessionCount,
    userId: row.userId,
  };
}

/** Fetch session counts for a set of group IDs in a single query. */
async function countSessionsForGroups(
  groupIds: string[],
): Promise<Map<string, number>> {
  if (groupIds.length === 0) return new Map();

  const rows = await db
    .select({
      groupId: bookmarkEntries.bookmarkGroupId,
      count: sql<number>`count(*)::int`,
    })
    .from(bookmarkEntries)
    .where(inArray(bookmarkEntries.bookmarkGroupId, groupIds))
    .groupBy(bookmarkEntries.bookmarkGroupId);

  return new Map(rows.map((r) => [r.groupId, r.count]));
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export async function listBookmarkGroups(): Promise<BookmarkGroup[]> {
  const groupRows = await db.select().from(bookmarkGroups);
  const ids = groupRows.map((r) => r.id);
  const counts = await countSessionsForGroups(ids);

  return groupRows.map((row) => mapGroupRow(row, counts.get(row.id) ?? 0));
}

export async function getBookmarkGroup(id: string): Promise<BookmarkGroup> {
  const [row] = await db.select().from(bookmarkGroups).where(eq(bookmarkGroups.id, id));
  if (!row) throw new HttpError(404, `Bookmark group ${id} not found`);

  const counts = await countSessionsForGroups([id]);
  return mapGroupRow(row, counts.get(id) ?? 0);
}

export async function createBookmarkGroup(dto: CreateBookmarkGroupDto): Promise<BookmarkGroup> {
  const [row] = await db
    .insert(bookmarkGroups)
    .values({
      name: dto.name,
      color: dto.color ?? '#6366f1',
      icon: dto.icon ?? null,
    })
    .returning();

  if (!row) throw new HttpError(500, 'Failed to create bookmark group');
  return mapGroupRow(row, 0);
}

export async function updateBookmarkGroup(
  id: string,
  dto: UpdateBookmarkGroupDto,
): Promise<BookmarkGroup> {
  const [updated] = await db
    .update(bookmarkGroups)
    .set({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      updatedAt: new Date(),
    })
    .where(eq(bookmarkGroups.id, id))
    .returning();

  if (!updated) throw new HttpError(404, `Bookmark group ${id} not found`);
  return getBookmarkGroup(id);
}

export async function deleteBookmarkGroup(id: string): Promise<void> {
  const [row] = await db.select().from(bookmarkGroups).where(eq(bookmarkGroups.id, id));
  if (!row) throw new HttpError(404, `Bookmark group ${id} not found`);
  await db.delete(bookmarkGroups).where(eq(bookmarkGroups.id, id));
}

// ─── Sessions in a group ──────────────────────────────────────────────────────

type SessionRow = typeof sessions.$inferSelect;

function mapSessionRow(row: SessionRow): Session {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    recordedAt: row.recordedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    midiFilename: row.midiFilename,
    audioFilename: row.audioFilename,
    durationMs: row.durationMs,
    userId: row.userId,
  };
}

export async function getSessionsInGroup(groupId: string): Promise<Session[]> {
  await getBookmarkGroup(groupId); // 404 if group doesn't exist

  const rows = await db
    .select({ session: sessions })
    .from(bookmarkEntries)
    .innerJoin(sessions, eq(bookmarkEntries.sessionId, sessions.id))
    .where(eq(bookmarkEntries.bookmarkGroupId, groupId))
    .orderBy(sessions.recordedAt);

  return rows.map(({ session }) => mapSessionRow(session));
}

export async function addSessionToGroup(groupId: string, sessionId: string): Promise<void> {
  await getBookmarkGroup(groupId);

  const [sessionRow] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!sessionRow) throw new HttpError(404, `Session ${sessionId} not found`);

  try {
    await db.insert(bookmarkEntries).values({ bookmarkGroupId: groupId, sessionId });
  } catch (err: unknown) {
    // PostgreSQL unique_violation — session already in group, treat as idempotent
    if ((err as { code?: string }).code === '23505') return;
    throw err;
  }
}

export async function removeSessionFromGroup(groupId: string, sessionId: string): Promise<void> {
  await db
    .delete(bookmarkEntries)
    .where(
      and(
        eq(bookmarkEntries.bookmarkGroupId, groupId),
        eq(bookmarkEntries.sessionId, sessionId),
      ),
    );
}

export async function getGroupsForSession(sessionId: string): Promise<BookmarkGroup[]> {
  // Get all group IDs this session belongs to
  const entryRows = await db
    .select({ groupId: bookmarkEntries.bookmarkGroupId })
    .from(bookmarkEntries)
    .where(eq(bookmarkEntries.sessionId, sessionId));

  if (entryRows.length === 0) return [];

  const groupIds = entryRows.map((r) => r.groupId);
  const groupRows = await db
    .select()
    .from(bookmarkGroups)
    .where(inArray(bookmarkGroups.id, groupIds));

  const counts = await countSessionsForGroups(groupIds);
  return groupRows.map((row) => mapGroupRow(row, counts.get(row.id) ?? 0));
}
