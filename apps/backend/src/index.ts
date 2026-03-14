import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { config } from './config';
import { db } from './db/client';
import { ensureUploadsDir } from './services/files';
import { initPlugins } from './plugins/registry';
import { errorHandler } from './middleware/error';
import { requestLogger } from './middleware/logger';
import { sessionsRouter } from './routes/sessions';
import { bookmarksRouter, sessionBookmarkGroupsRouter } from './routes/bookmarks';
import { pluginsRouter } from './routes/plugins';
import { healthRouter } from './routes/health';

const app = new Hono();

// ─── Global middleware ────────────────────────────────────────────────────────

app.use('*', requestLogger);

app.use(
  '*',
  cors({
    origin: config.frontendUrl,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── API routes ───────────────────────────────────────────────────────────────

const api = new Hono().basePath('/api/v1');

api.route('/sessions', sessionsRouter);
// /api/v1/sessions/:id/bookmark-groups — sits on the same /sessions base path
api.route('/sessions', sessionBookmarkGroupsRouter);
api.route('/bookmark-groups', bookmarksRouter);
api.route('/plugins', pluginsRouter);
api.route('/health', healthRouter);

app.route('/', api);

// ─── Error handler ────────────────────────────────────────────────────────────

app.onError(errorHandler);

// ─── 404 ──────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.notFound((c: any) => c.json({ error: 'Not found' }, 404));

// ─── Startup ──────────────────────────────────────────────────────────────────

await ensureUploadsDir();
await initPlugins(app, db, config);

console.log(`Midiary backend starting on port ${config.port} (${config.nodeEnv})`);

serve({
  fetch: app.fetch,
  port: config.port,
});
