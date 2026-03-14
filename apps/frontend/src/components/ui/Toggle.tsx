interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, disabled, label, size = 'md' }: ToggleProps) {
  const trackW = size === 'sm' ? 'w-8' : 'w-10';
  const trackH = size === 'sm' ? 'h-4' : 'h-5';
  const thumbSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const translateX = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
          trackW, trackH,
          checked ? 'bg-[var(--accent)]' : 'bg-[var(--border-strong)]',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        <span
          className={[
            'block rounded-full bg-white shadow-sm transition-transform duration-200',
            thumbSize,
            checked ? translateX : 'translate-x-0.5',
          ].join(' ')}
        />
      </button>
      {label && (
        <span className="text-sm text-[var(--text-primary)]">{label}</span>
      )}
    </label>
  );
}
