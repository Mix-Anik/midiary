import { NavLink } from 'react-router-dom';
import { Library, Bookmark, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import type { NavItem } from '@midiary/shared';

interface SidebarProps {
  pluginNavItems?: NavItem[];
}

interface NavEntry {
  to: string;
  icon: ReactNode;
  label: string;
  end?: boolean;
}

const coreNav: NavEntry[] = [
  { to: '/',          icon: <Library size={18} />,  label: 'Sessions',  end: true },
  { to: '/bookmarks', icon: <Bookmark size={18} />, label: 'Bookmarks' },
  { to: '/settings',  icon: <Settings size={18} />, label: 'Settings'  },
];

export function Sidebar({ pluginNavItems = [] }: SidebarProps) {
  const allNav = [
    ...coreNav,
    ...pluginNavItems.map((item) => ({
      to: item.path,
      icon: <span className="text-base leading-none">{item.icon ?? '⊕'}</span>,
      label: item.label,
    })),
  ];

  return (
    <aside
      className="flex flex-col h-full border-r border-[var(--border)] bg-[var(--bg-elevated)]"
      style={{ width: 'var(--sidebar-width)', flexShrink: 0 }}
    >
      {/* Logo */}
      <div className="h-14 px-5 flex items-center border-b border-[var(--border)]">
        <span className="font-display text-lg font-medium tracking-tight text-[var(--text-primary)]">
          Midiary
        </span>
        <span
          className="ml-1.5 text-xs font-mono text-[var(--text-muted)] mt-1 leading-none"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          diary
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {allNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-150',
                    'focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none',
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]',
                  ].join(' ')
                }
              >
                <span className="flex-shrink-0 opacity-90">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
          v1.0.0
        </p>
      </div>
    </aside>
  );
}
