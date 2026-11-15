import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all focus:ring-2 outline-none disabled:opacity-50 disabled:pointer-events-none truncate';

  const variants = {
    primary:
      'bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20 focus:ring-primary/20',
    secondary: 'border border-border bg-background text-foreground hover:bg-muted',
    outline: 'border border-border bg-transparent hover:bg-muted text-foreground',
    ghost: 'hover:bg-muted text-muted-foreground hover:text-foreground',
  };

  const sizes = {
    sm: 'px-3 h-8 text-xs',
    md: 'px-4 h-10 text-sm',
    lg: 'px-4 h-12 text-base',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
