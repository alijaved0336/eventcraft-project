import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard component that ensures only authenticated users can access children routes.
 * Uses the Zustand auth store for real-time synchronization with the session state.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  // Only show the loader if we're still initializing.
  // This prevents components from rendering before the accessToken is confirmed.
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary font-black">
            progress_activity
          </span>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">
            Initializing Session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated, saving the current location
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
