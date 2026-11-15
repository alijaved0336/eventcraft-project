import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { gql } from '@apollo/client';
import { apolloClient as client } from '@/lib/apollo/client';
import { tokenStore } from '@/lib/auth/tokenStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const GET_ME_QUERY = gql`
  query GetMe {
    me {
      id
      email
      name
      role
      permissions {
        action
        level
      }
    }
  }
`;

interface GetMeResponse {
  me: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: {
      action: string;
      level: string;
    }[];
  };
}

/**
 * Handles the redirect from OAuth providers (Google).
 * Extracts the token from the URL hash, stores it in memory,
 * and fetches the full user profile to initialize the Zustand store.
 */
const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();
  const hasProcessed = React.useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      try {
        // Extract the token exactly matching the backend output: #token=...
        const hash = location.hash;
        if (!hash || !hash.includes('token=')) {
          throw new Error('No authentication token provided from the server.');
        }

        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('token');

        if (!accessToken) {
          throw new Error('Authentication token is missing.');
        }

        // Store the token in-memory safely.
        tokenStore.set(accessToken);

        // Fetch user data via GraphQL using the stored token
        // The apolloClient is already configured to pick up the token from tokenStore.
        const { data } = await client.query<GetMeResponse>({
          query: GET_ME_QUERY,
          fetchPolicy: 'network-only',
        });

        if (!data || !data.me) {
          throw new Error('Failed to retrieve user profile.');
        }

        // Initialize state in Zustand
        setUser({
          ...data.me,
          fullName: data.me.name,
        });

        toast.success('Successfully logged in with Google!');
        navigate('/', { replace: true });
      } catch (err: unknown) {
        // Fallback cleanup
        tokenStore.clear();
        const errorMessage = err instanceof Error ? err.message : 'OAuth authentication failed.';
        toast.error(errorMessage);
        navigate('/auth/login', { replace: true });
      }
    };

    processCallback();
  }, [location, navigate, setUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <div className="flex flex-col items-center gap-1">
        <p className="text-slate-900 dark:text-white font-black text-lg tracking-tight">
          Completing Secure Sign In
        </p>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Verifying Credentials...
        </p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
