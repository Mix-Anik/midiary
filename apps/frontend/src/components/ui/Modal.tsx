import { useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** Width of the modal panel */
  width?: 'sm' | 'md' | 'lg';
  /** Hide the default header */
  bare?: boolean;
}

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({ open, onClose, title, description, children, width = 'md', bare }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--bg-overlay)] animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={[
          'relative w-full rounded-xl shadow-lg overflow-hidden animate-scale-in',
          'bg-[var(--bg-surface)] border border-[var(--border)]',
          widthClasses[width],
        ].join(' ')}
      >
        {!bare && (
          <div className="flex items-start justify-between px-6 pt-5 pb-0">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-display font-medium text-[var(--text-primary)]"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 mt-0.5 p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className={bare ? '' : 'px-6 py-5'}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
