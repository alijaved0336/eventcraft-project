import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-foreground text-sm font-semibold opacity-90" htmlFor={props.id}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            type={type === 'password' && showPassword ? 'text' : type}
            className={cn(
              'w-full h-12 rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground text-foreground',
              icon ? 'pl-10' : 'pl-4',
              type === 'password' ? 'pr-10' : 'pr-4',
              error && 'border-destructive focus:ring-destructive/20 focus:border-destructive',
              className,
            )}
            {...props}
          />
          {type === 'password' && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <span className="material-symbols-outlined text-xl block">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
