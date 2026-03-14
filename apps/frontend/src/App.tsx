import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import { SessionListPage } from './pages/SessionListPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { SettingsPage } from './pages/SettingsPage';
import { getPluginNavItems, getPluginRoutes } from './plugins/registry';

export function App() {
  const pluginNavItems = getPluginNavItems();
  const pluginRoutes = getPluginRoutes();

  return (
    <div className="flex h-full bg-[var(--bg-base)]">
      {/* Left sidebar */}
      <Sidebar pluginNavItems={pluginNavItems} />

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-hidden bg-[var(--bg-base)]">
        <Routes>
          <Route path="/" element={<SessionListPage />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Plugin-contributed routes */}
          {pluginRoutes.map((r) => (
            <Route
              key={r.path}
              path={r.path}
              element={r.element as React.ReactNode}
            />
          ))}

          {/* 404 fallback */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-full">
                <p className="text-[var(--text-muted)] text-sm">Page not found</p>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
