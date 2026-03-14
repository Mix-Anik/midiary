import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: string;   // hex colour for the dot
  className?: string;
  onClick?: () => void;
}

export function Badge({ children, color, className = '', onClick }: BadgeProps) {
  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={[
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]',
        'transition-colors duration-150',
        onClick ? 'cursor-pointer hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]' : '',
        className,
      ].join(' ')}
    >
      {color && (
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </span>
  );
}
