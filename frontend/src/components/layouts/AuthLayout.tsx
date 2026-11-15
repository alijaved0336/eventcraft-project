import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const AuthLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="layout-container flex h-full grow flex-col min-h-screen">
      {/* Navigation Bar */}
      <header className="flex items-center justify-between border-b border-border px-6 md:px-20 py-4 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="text-primary">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z"
                fill="currentColor"
                fillRule="evenodd"
              ></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">EventCraft</h2>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <ThemeToggle />
          {location.pathname === '/auth/register' ? (
            <Link
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              to="/auth/login"
            >
              Already have an account? <span className="text-primary">Log In</span>
            </Link>
          ) : location.pathname === '/auth/login' ? (
            <Link
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              to="/auth/register"
            >
              New here? <span className="text-primary">Sign Up</span>
            </Link>
          ) : null}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[480px] space-y-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-muted-foreground text-xs">
        © {new Date().getFullYear()} EventCraft Inc. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthLayout;
