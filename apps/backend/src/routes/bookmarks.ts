import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { BOOKMARK_GROUP_ICONS } from '@midiary/shared';
import {
  listBookmarkGroups,
  getBookmarkGroup,
  createBookmarkGroup,
  updateBookmarkGroup,
  deleteBookmarkGroup,
  getSessionsInGroup,
  addSessionToGroup,
  removeSessionFromGroup,
  getGroupsForSession,
} from '../services/bookmarks';

const iconEnum = z.enum(BOOKMARK_GROUP_ICONS).nullable().optional();

const createGroupSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: iconEnum,
});

const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: iconEnum,
});

const addSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export const bookmarksRouter = new Hono();

// GET /bookmark-groups
bookmarksRouter.get('/', async (c) => {
  return c.json(await listBookmarkGroups());
});

// POST /bookmark-groups
bookmarksRouter.post('/', zValidator('json', createGroupSchema), async (c) => {
  const dto = c.req.valid('json');
  return c.json(await createBookmarkGroup(dto), 201);
});

// PATCH /bookmark-groups/:id
bookmarksRouter.patch('/:id', zValidator('json', updateGroupSchema), async (c) => {
  const dto = c.req.valid('json');
  return c.json(await updateBookmarkGroup(c.req.param('id'), dto));
});

// DELETE /bookmark-groups/:id
bookmarksRouter.delete('/:id', async (c) => {
  await deleteBookmarkGroup(c.req.param('id'));
  return c.body(null, 204);
});

// GET /bookmark-groups/:id/sessions
bookmarksRouter.get('/:id/sessions', async (c) => {
  return c.json(await getSessionsInGroup(c.req.param('id')));
});

// POST /bookmark-groups/:id/sessions
bookmarksRouter.post('/:id/sessions', zValidator('json', addSessionSchema), async (c) => {
  const { sessionId } = c.req.valid('json');
  await addSessionToGroup(c.req.param('id'), sessionId);
  return c.body(null, 204);
});

// DELETE /bookmark-groups/:id/sessions/:sessionId
bookmarksRouter.delete('/:id/sessions/:sessionId', async (c) => {
  await removeSessionFromGroup(c.req.param('id'), c.req.param('sessionId'));
  return c.body(null, 204);
});

// GET /sessions/:id/bookmark-groups  — mounted separately on the sessions path
export const sessionBookmarkGroupsRouter = new Hono();

sessionBookmarkGroupsRouter.get('/:id/bookmark-groups', async (c) => {
  return c.json(await getGroupsForSession(c.req.param('id')));
});
