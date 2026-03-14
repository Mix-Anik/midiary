import { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { usePluginsStore } from '../store/plugins';
import { Toggle } from '../components/ui/Toggle';
import { getRegisteredPlugins } from '../plugins/registry';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { plugins, isLoading, fetchPlugins, togglePlugin } = usePluginsStore();

  useEffect(() => {
    if (plugins.length === 0) fetchPlugins();
  }, [fetchPlugins, plugins.length]);

  const registeredPlugins = getRegisteredPlugins();

  return (
    <div className="flex flex-col h-full">
      <header className="px-8 py-5 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <h1 className="font-display text-2xl text-[var(--text-primary)]">Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-xl space-y-10">
          {/* Appearance */}
          <section>
            <h2 className="text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase mb-4">
              Appearance
            </h2>

            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Theme</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {theme === 'light' ? 'Light mode' : 'Dark mode'} — persisted to your browser
                  </p>
                </div>

                {/* Theme switcher pills */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                  <button
                    onClick={() => setTheme('light')}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                      theme === 'light'
                        ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                    ].join(' ')}
                  >
                    <Sun size={13} /> Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                      theme === 'dark'
                        ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                    ].join(' ')}
                  >
                    <Moon size={13} /> Dark
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Plugins */}
          <section>
            <h2 className="text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase mb-4">
              Plugins
            </h2>

            {registeredPlugins.length === 0 ? (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 text-center">
                <p className="text-sm text-[var(--text-muted)]">No plugins registered.</p>
              </div>
            ) : (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl divide-y divide-[var(--border)]">
                {registeredPlugins.map((plugin) => {
                  const serverState = plugins.find((p) => p.manifest.id === plugin.manifest.id);
                  const enabled = serverState?.enabled ?? true;
                  const SettingsPanel = plugin.SettingsPanel as React.FC | undefined;

                  return (
                    <div key={plugin.manifest.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{plugin.manifest.name}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{plugin.manifest.description}</p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">v{plugin.manifest.version}</p>
                        </div>
                        <Toggle
                          checked={enabled}
                          onChange={(v) => togglePlugin(plugin.manifest.id, v)}
                          disabled={isLoading}
                          size="md"
                        />
                      </div>

                      {enabled && SettingsPanel && (
                        <div className="mt-4 pt-4 border-t border-[var(--border)]">
                          <SettingsPanel />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
