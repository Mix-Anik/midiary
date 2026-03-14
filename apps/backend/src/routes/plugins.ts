import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { listPlugins, updatePluginPreference } from '../services/plugins';

const updatePluginSchema = z.object({
  enabled: z.boolean(),
});

export const pluginsRouter = new Hono();

// GET /plugins
pluginsRouter.get('/', async (c) => {
  return c.json(await listPlugins());
});

// PATCH /plugins/:pluginId
pluginsRouter.patch('/:pluginId', zValidator('json', updatePluginSchema), async (c) => {
  const dto = c.req.valid('json');
  return c.json(await updatePluginPreference(c.req.param('pluginId'), dto));
});
