import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Saving changes...',
  className,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-9999 flex items-center justify-center bg-white/60 backdrop-blur-md transition-all duration-300 animate-in fade-in dark:bg-slate-950/60',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Animated Spinner with Gradient */}
        <div className="relative size-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]" />

          {/* Inner pulsating glow */}
          <div className="absolute inset-2 animate-pulse rounded-full bg-primary/20 blur-sm" />
        </div>

        <div className="space-y-2">
          <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {message}
          </p>
          <p className="text-sm font-medium text-slate-500 animate-pulse">
            This will only take a moment
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
