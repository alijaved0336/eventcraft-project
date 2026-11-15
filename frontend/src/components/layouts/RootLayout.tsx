import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client/react';
import { Toaster } from 'sonner';
import { store } from '@/store';
import { apolloClient as client } from '@/lib/apollo/client';
import Navbar from '@/components/layouts/Navbar';
import Sidebar from '@/components/layouts/Sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import { useAuthStore } from '@/store/authStore';
import { refreshAccessToken } from '@/lib/auth/refreshToken';

const RootLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const completeInitialization = useAuthStore((state) => state.completeInitialization);

  useEffect(() => {
    const initSession = async () => {
      // Only attempt proactive refresh if we have a reason to believe a session exists
      const hasSessionHint = !!localStorage.getItem('user');
      
      if (!hasSessionHint) {
        completeInitialization();
        return;
      }

      try {
        // Proactively attempt to refresh the session on app mount
        await refreshAccessToken();
      } catch (err) {
        console.error('Session initialization failed:', err);
      } finally {
        completeInitialization();
      }
    };

    initSession();

    /**
     * Listen for global auth:logout events dispatched by the authentication layer.
     * This ensures the UI state is cleared even if the logout was triggered
     * by a background interceptor (e.g., Axios or Apollo).
     */
    const handleLogout = () => {
      logout();
      
      // Define public routes that shouldn't force a redirect to login on session failure
      const { pathname } = window.location;
      const isPublicBase = pathname === '/' || pathname === '/events' || pathname.startsWith('/auth');
      const isEventDetail = pathname.startsWith('/events/') && 
                           !pathname.startsWith('/events/create') && 
                           !pathname.startsWith('/events/edit/');
      
      if (!isPublicBase && !isEventDetail) {
        navigate('/auth/login', { replace: true });
      }
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [logout, navigate, completeInitialization]);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isAuthPage = location.pathname.startsWith('/auth');
  const isLandingPage = location.pathname === '/' || location.pathname === '/organizer';
  const isEventDetail =
    location.pathname.startsWith('/events/') &&
    !location.pathname.startsWith('/events/create') &&
    !location.pathname.startsWith('/events/edit/');

  const showSidebar = !isAuthPage && !isLandingPage && !(isEventDetail && !isAuthenticated);

  return (
    <Provider store={store}>
      <ApolloProvider client={client}>
        <ThemeProvider defaultTheme="system" storageKey="eventcraft-ui-theme">
          <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/30 antialiased flex flex-col font-inter">
            {!isAuthPage && <Navbar />}
            <div className="flex flex-1">
              {showSidebar && <Sidebar />}
              <main
                className={`flex-1 min-h-screen ${!isAuthPage ? 'pt-[72px]' : ''}`}
              >
                <Outlet />
              </main>
            </div>
          </div>

          <Toaster position="bottom-right" closeButton richColors theme="system" />
        </ThemeProvider>
      </ApolloProvider>
    </Provider>
  );
};

export default RootLayout;
