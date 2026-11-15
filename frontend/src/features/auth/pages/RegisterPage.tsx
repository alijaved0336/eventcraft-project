import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import Button from '@/components/ui/button';

const RegisterPage: React.FC = () => {
  return (
    <>
      <div className="bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-primary/10 overflow-hidden">
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 text-center">
            Create account
          </h2>

          <div className="flex flex-col gap-3 mb-6">
            <Button
              className="w-full text-slate-700 dark:text-slate-200"
              size="lg"
              variant="secondary"
              onClick={() =>
                (window.location.href =
                  `${import.meta.env.VITE_API_URL || ''}/api/auth/google`.replace(/\/+api/, '/api'))
              }
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                ></path>
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                ></path>
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                ></path>
              </svg>
              <span className="font-bold">Continue with Google</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center gap-4 my-6">
            <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              or register with email
            </span>
            <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Registration Form */}
          <RegisterForm />
        </div>

        {/* Card Footer */}
        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Already a member?{' '}
            <Link className="font-bold text-primary hover:text-primary/80" to="/auth/login">
              Log in to your account
            </Link>
          </p>
        </div>
      </div>

      {/* Footer Links */}
      <div className="mt-8 flex justify-center gap-6 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
        <span className="cursor-not-allowed opacity-50" title="Coming Soon">
          Terms
        </span>
        <span className="cursor-not-allowed opacity-50" title="Coming Soon">
          Privacy
        </span>
        <span className="cursor-not-allowed opacity-50" title="Coming Soon">
          Contact
        </span>
      </div>
    </>
  );
};

export default RegisterPage;
