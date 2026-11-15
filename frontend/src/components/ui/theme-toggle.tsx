import React from 'react';
import { useTheme } from '@/components/use-theme';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-[38px] w-[72px] shrink-0 cursor-pointer items-center rounded-full bg-muted border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      )}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
    >
      {/* Background Icons (Always Visible) */}
      <div className="absolute inset-0 flex items-center justify-between px-[10px] pointer-events-none text-muted-foreground/30">
        <span className="material-symbols-outlined text-[18px]">light_mode</span>
        <span className="material-symbols-outlined text-[18px]">dark_mode</span>
      </div>

      {/* Sliding Thumb Container */}
      <div
        className={cn(
          'pointer-events-none absolute left-0 top-0 flex h-full items-center transition-transform duration-200 ease-in-out z-10',
          isDark ? 'translate-x-[36px]' : 'translate-x-[4px]',
        )}
      >
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-background shadow-sm ring-0">
          {isDark ? (
            <span className="material-symbols-outlined text-[18px] text-primary">dark_mode</span>
          ) : (
            <span className="material-symbols-outlined text-[18px] text-primary">light_mode</span>
          )}
        </span>
      </div>
    </button>
  );
}
