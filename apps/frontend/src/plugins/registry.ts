/**
 * Frontend plugin registry.
 *
 * To add a new plugin:
 *   1. Import it below
 *   2. Add it to the `plugins` array
 *   3. That's it — all plugin slots (PianoRollOverlay, SessionSidebarWidget,
 *      SettingsPanel, routes, navItems) are automatically picked up.
 */
import type { FrontendPlugin, FrontendPluginAPI } from './types';
import { playbackCursorPlugin } from './built-in/playback-cursor/index';

const plugins: FrontendPlugin[] = [
  playbackCursorPlugin,
];

export function getRegisteredPlugins(): FrontendPlugin[] {
  return plugins;
}

/**
 * Initialise all registered plugins. Call once after the Zustand stores are
 * ready (i.e. inside the root component, after first render).
 */
export function initFrontendPlugins(api: FrontendPluginAPI): void {
  for (const plugin of plugins) {
    if (plugin.init) {
      plugin.init(api);
    }
  }
}

/** Collect all plugin-contributed nav items, sorted by `order`. */
export function getPluginNavItems() {
  return plugins
    .flatMap((p) => p.navItems ?? [])
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

/** Collect all plugin-contributed routes. */
export function getPluginRoutes() {
  return plugins.flatMap((p) => p.routes ?? []);
}
