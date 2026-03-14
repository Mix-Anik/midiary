import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import type { HealthResponse } from '@midiary/shared';
import { db } from '../db/client';

export const healthRouter = new Hono();

healthRouter.get('/', async (c) => {
  let dbStatus: HealthResponse['db'] = 'connected';

  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    dbStatus = 'error';
  }

  const body: HealthResponse = {
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    version: process.env['npm_package_version'] ?? '1.0.0',
    db: dbStatus,
  };

  return c.json(body, body.status === 'ok' ? 200 : 503);
});
