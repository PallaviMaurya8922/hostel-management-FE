import React from 'react';
import { useTheme } from '../contexts';

export type ThemeToggleVariant = 'toolbar' | 'floating';

interface ThemeToggleProps {
  className?: string;
  /** `toolbar`: inline header-style (default). `floating`: legacy fixed corner (avoid on desktop). */
  variant?: ThemeToggleVariant;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', variant = 'toolbar' }) => {
  const { isDark, toggleTheme } = useTheme();

  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  const moonSun = isDark ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2 12h2.2M19.8 12H22M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5Z" />
    </svg>
  );

  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        title={label}
        className={[
          'fixed bottom-5 right-5 z-50 inline-flex items-center gap-2',
          'rounded-full border border-gray-300 bg-white px-4 py-2.5',
          'text-sm font-semibold text-gray-700 shadow-lg transition-colors duration-200',
          'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
          'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800',
          className,
        ].join(' ')}
      >
        {moonSun}
        <span>{isDark ? 'Light' : 'Dark'}</span>
      </button>
    );
  }

  /* toolbar: matches AppShell header icon buttons — no overlap with page content */
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={[
        'inline-flex shrink-0 items-center justify-center rounded-xl p-2',
        'text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40',
        'dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white',
        className,
      ].join(' ')}
    >
      {moonSun}
    </button>
  );
};

export default ThemeToggle;
