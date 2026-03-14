import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import type { Session } from '@midiary/shared';
import type { SessionBookmarkChip } from '@midiary/shared';
import {
  listSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
} from '../services/sessions';
import { storedFilePath, contentTypeForFilename } from '../services/files';
import { HttpError } from '../middleware/error';

const updateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  recordedAt: z.string().datetime().optional(),
});

export type SessionWithChips = Session & { bookmarkChips: SessionBookmarkChip[] };

export const sessionsRouter = new Hono();

// GET /sessions
sessionsRouter.get('/', async (c) => {
  const data = await listSessions();
  return c.json(data);
});

// GET /sessions/:id
sessionsRouter.get('/:id', async (c) => {
  const data = await getSession(c.req.param('id'));
  return c.json(data);
});

// POST /sessions  (multipart/form-data)
sessionsRouter.post('/', async (c) => {
  const body = await c.req.parseBody();

  const title = body['title'];
  const recordedAt = body['recordedAt'];
  const description = body['description'];
  const midiFile = body['midi'];
  const audioFile = body['audio'];

  if (typeof title !== 'string' || !title.trim()) {
    throw new HttpError(400, 'Field "title" is required');
  }
  if (typeof recordedAt !== 'string' || !recordedAt) {
    throw new HttpError(400, 'Field "recordedAt" is required');
  }
  if (!(midiFile instanceof File)) {
    throw new HttpError(400, 'Field "midi" must be a file');
  }
  if (!(audioFile instanceof File)) {
    throw new HttpError(400, 'Field "audio" must be a file');
  }

  const data = await createSession(
    {
      title: title.trim(),
      description: typeof description === 'string' ? description : undefined,
      recordedAt,
    },
    midiFile,
    audioFile,
  );

  return c.json(data, 201);
});

// PATCH /sessions/:id
sessionsRouter.patch(
  '/:id',
  zValidator('json', updateSessionSchema),
  async (c) => {
    const dto = c.req.valid('json');
    const data = await updateSession(c.req.param('id'), dto);
    return c.json(data);
  },
);

// DELETE /sessions/:id
sessionsRouter.delete('/:id', async (c) => {
  await deleteSession(c.req.param('id'));
  return c.body(null, 204);
});

// GET /sessions/:id/midi
sessionsRouter.get('/:id/midi', async (c) => {
  const session = await getSession(c.req.param('id'));
  const filePath = storedFilePath(session.midiFilename);
  const contentType = contentTypeForFilename(session.midiFilename);

  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new Response(webStream, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${session.midiFilename}"`,
    },
  });
});

// GET /sessions/:id/audio
sessionsRouter.get('/:id/audio', async (c) => {
  const session = await getSession(c.req.param('id'));
  const filePath = storedFilePath(session.audioFilename);
  const contentType = contentTypeForFilename(session.audioFilename);

  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new Response(webStream, {
    headers: {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    },
  });
});
