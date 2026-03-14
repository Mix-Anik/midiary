import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // CSS-var backed palette — use these in JSX for Tailwind IntelliSense
        base:       'var(--bg-base)',
        surface:    'var(--bg-surface)',
        elevated:   'var(--bg-elevated)',
        accent:     'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        border:     'var(--border)',
        'border-strong': 'var(--border-strong)',
        primary:    'var(--text-primary)',
        secondary:  'var(--text-secondary)',
        muted:      'var(--text-muted)',
        danger:     'var(--danger)',
        success:    'var(--success)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      animation: {
        'fade-in':     'fadeIn 180ms ease forwards',
        'slide-up':    'slideUp 220ms ease forwards',
        'scale-in':    'scaleIn 180ms ease forwards',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
} satisfies Config;
