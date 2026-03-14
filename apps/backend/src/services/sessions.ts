import { eq, desc, inArray } from 'drizzle-orm';
import MidiPkg from '@tonejs/midi';
import fs from 'node:fs/promises';
import type { Session, CreateSessionDto, UpdateSessionDto, SessionWithBookmarkChips, SessionBookmarkChip } from '@midiary/shared';
// Session is used by mapRow() return type internally
import { db } from '../db/client';
import { sessions, bookmarkEntries, bookmarkGroups } from '../db/schema';
import { saveUploadedFile, deleteStoredFile, storedFilePath } from './files';
import { HttpError } from '../middleware/error';

// ─── Type mapping ─────────────────────────────────────────────────────────────

type SessionRow = typeof sessions.$inferSelect;

const { Midi } = MidiPkg as unknown as { Midi: typeof import('@tonejs/midi').Midi };

function mapRow(row: SessionRow): Session {
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

/** Parse MIDI duration from the stored file. Returns null on any parse failure. */
async function parseMidiDuration(midiFilename: string): Promise<number | null> {
  try {
    const buf = await fs.readFile(storedFilePath(midiFilename));
    const midi = new Midi(buf);
    let maxSeconds = 0;
    for (const track of midi.tracks) {
      for (const note of track.notes) {
        const end = note.time + note.duration;
        if (end > maxSeconds) maxSeconds = end;
      }
    }
    return maxSeconds > 0 ? Math.round(maxSeconds * 1000) : null;
  } catch {
    // TODO: log parse failure
    return null;
  }
}

// ─── Bookmark chips helper ────────────────────────────────────────────────────

export async function getBookmarkChipsForSessions(
  sessionIds: string[],
): Promise<Map<string, SessionBookmarkChip[]>> {
  const chipsMap = new Map<string, SessionBookmarkChip[]>();
  if (sessionIds.length === 0) return chipsMap;

  const rows = await db
    .select({
      sessionId: bookmarkEntries.sessionId,
      groupId: bookmarkGroups.id,
      name: bookmarkGroups.name,
      color: bookmarkGroups.color,
      icon: bookmarkGroups.icon,
    })
    .from(bookmarkEntries)
    .innerJoin(bookmarkGroups, eq(bookmarkEntries.bookmarkGroupId, bookmarkGroups.id))
    .where(inArray(bookmarkEntries.sessionId, sessionIds));

  for (const row of rows) {
    const chip: SessionBookmarkChip = {
      groupId: row.groupId,
      name: row.name,
      color: row.color,
      icon: row.icon as SessionBookmarkChip['icon'],
    };
    const existing = chipsMap.get(row.sessionId) ?? [];
    existing.push(chip);
    chipsMap.set(row.sessionId, existing);
  }

  return chipsMap;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function listSessions(): Promise<SessionWithBookmarkChips[]> {
  const rows = await db
    .select()
    .from(sessions)
    .orderBy(desc(sessions.recordedAt));

  const mapped = rows.map(mapRow);
  const ids = mapped.map((s) => s.id);
  const chipsMap = await getBookmarkChipsForSessions(ids);

  return mapped.map((s) => ({
    ...s,
    bookmarkChips: chipsMap.get(s.id) ?? [],
  }));
}

export async function getSession(
  id: string,
): Promise<SessionWithBookmarkChips> {
  const [row] = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!row) throw new HttpError(404, `Session ${id} not found`);

  const chipsMap = await getBookmarkChipsForSessions([id]);
  return { ...mapRow(row), bookmarkChips: chipsMap.get(id) ?? [] };
}

export async function createSession(
  dto: CreateSessionDto,
  midiFile: File,
  audioFile: File,
): Promise<SessionWithBookmarkChips> {
  const midiFilename = await saveUploadedFile(midiFile, 'midi');
  let audioFilename: string;
  try {
    audioFilename = await saveUploadedFile(audioFile, 'audio');
  } catch (err) {
    await deleteStoredFile(midiFilename);
    throw err;
  }

  const durationMs = await parseMidiDuration(midiFilename);

  const [row] = await db
    .insert(sessions)
    .values({
      title: dto.title,
      description: dto.description ?? null,
      recordedAt: new Date(dto.recordedAt),
      midiFilename,
      audioFilename,
      durationMs,
    })
    .returning();

  if (!row) throw new HttpError(500, 'Failed to create session');
  return { ...mapRow(row), bookmarkChips: [] };
}

export async function updateSession(
  id: string,
  dto: UpdateSessionDto,
): Promise<SessionWithBookmarkChips> {
  const existing = await getSession(id);

  const [updated] = await db
    .update(sessions)
    .set({
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.recordedAt !== undefined && { recordedAt: new Date(dto.recordedAt) }),
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, id))
    .returning();

  if (!updated) throw new HttpError(404, `Session ${id} not found`);

  return { ...mapRow(updated), bookmarkChips: existing.bookmarkChips };
}

export async function deleteSession(id: string): Promise<void> {
  const [row] = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!row) throw new HttpError(404, `Session ${id} not found`);

  await db.delete(sessions).where(eq(sessions.id, id));

  // Delete files after DB row is gone — if these fail the session is already deleted.
  await Promise.allSettled([
    deleteStoredFile(row.midiFilename),
    deleteStoredFile(row.audioFilename),
  ]);
}
