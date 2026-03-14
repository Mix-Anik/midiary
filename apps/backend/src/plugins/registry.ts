import type { BackendPlugin, BackendPluginAPI } from './types';
import type { Hono } from 'hono';
import type { DB } from '../db/client';
import type { Config } from '../config';

// ─── Plugin registry ──────────────────────────────────────────────────────────
// To add a new backend plugin:
//   1. Import it here
//   2. Add it to the `plugins` array
//
// Example:
//   import { myPlugin } from './built-in/my-plugin/index';
//   const plugins: BackendPlugin[] = [myPlugin];

const plugins: BackendPlugin[] = [
  // The built-in playback-cursor plugin is frontend-only — no backend part.
];

export function getRegisteredPlugins(): BackendPlugin[] {
  return plugins;
}

/** Called once at server startup — runs each plugin's register() lifecycle hook. */
export async function initPlugins(app: Hono, db: DB, config: Config): Promise<void> {
  const api: BackendPluginAPI = { app, db, config };

  for (const plugin of plugins) {
    if (plugin.register) {
      await plugin.register(api);
      console.log(`[plugin] registered: ${plugin.manifest.id}`);
    }
  }
}
