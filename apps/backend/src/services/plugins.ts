import { eq } from 'drizzle-orm';
import type { PluginWithState, UpdatePluginPreferenceDto } from '@midiary/shared';
import { db } from '../db/client';
import { pluginPreferences } from '../db/schema';
import { getRegisteredPlugins } from '../plugins/registry';
import { HttpError } from '../middleware/error';

// ─── Plugin state ─────────────────────────────────────────────────────────────

export async function listPlugins(): Promise<PluginWithState[]> {
  const registered = getRegisteredPlugins();

  // Load all DB preferences in one query
  const prefs = await db.select().from(pluginPreferences);
  const prefMap = new Map(prefs.map((p) => [p.pluginId, p]));

  return registered.map((plugin) => {
    const pref = prefMap.get(plugin.manifest.id);
    return {
      manifest: plugin.manifest,
      enabled: pref?.enabled ?? true,
      config: pref?.config ?? null,
    };
  });
}

export async function updatePluginPreference(
  pluginId: string,
  dto: UpdatePluginPreferenceDto,
): Promise<PluginWithState> {
  const registered = getRegisteredPlugins();
  const plugin = registered.find((p) => p.manifest.id === pluginId);
  if (!plugin) throw new HttpError(404, `Plugin ${pluginId} not found`);

  // Upsert the preference row
  await db
    .insert(pluginPreferences)
    .values({ pluginId, enabled: dto.enabled })
    .onConflictDoUpdate({
      target: pluginPreferences.pluginId,
      set: { enabled: dto.enabled },
    });

  const [pref] = await db
    .select()
    .from(pluginPreferences)
    .where(eq(pluginPreferences.pluginId, pluginId));

  return {
    manifest: plugin.manifest,
    enabled: pref?.enabled ?? dto.enabled,
    config: pref?.config ?? null,
  };
}
