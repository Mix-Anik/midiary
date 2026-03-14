import { create } from 'zustand';
import type { PluginWithState } from '@midiary/shared';
import { pluginsApi } from '../api/client';

interface PluginsState {
  plugins: PluginWithState[];
  isLoading: boolean;

  fetchPlugins: () => Promise<void>;
  togglePlugin: (pluginId: string, enabled: boolean) => Promise<void>;
}

export const usePluginsStore = create<PluginsState>((set) => ({
  plugins: [],
  isLoading: false,

  fetchPlugins: async () => {
    set({ isLoading: true });
    try {
      const data = await pluginsApi.list();
      set({ plugins: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  togglePlugin: async (pluginId, enabled) => {
    // Optimistic update
    set((s) => ({
      plugins: s.plugins.map((p) =>
        p.manifest.id === pluginId ? { ...p, enabled } : p,
      ),
    }));
    try {
      const updated = await pluginsApi.update(pluginId, { enabled });
      set((s) => ({
        plugins: s.plugins.map((p) =>
          p.manifest.id === pluginId ? updated : p,
        ),
      }));
    } catch {
      // Revert on failure
      set((s) => ({
        plugins: s.plugins.map((p) =>
          p.manifest.id === pluginId ? { ...p, enabled: !enabled } : p,
        ),
      }));
    }
  },
}));
