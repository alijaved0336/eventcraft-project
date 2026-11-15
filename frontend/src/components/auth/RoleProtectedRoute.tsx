import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary font-black">
            progress_activity
          </span>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">
            Checking Permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  const hasRole = user?.role && allowedRoles.includes(user.role);

  if (!hasRole) {
    // Redirect to dashboard or unauthorized page
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
