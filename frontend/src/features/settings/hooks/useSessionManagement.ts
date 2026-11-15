import { useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { ApolloCache } from '@apollo/client';
import { toast } from 'sonner';
import {
  MY_ACTIVE_SESSIONS_QUERY,
  REVOKE_SESSION_MUTATION,
  REVOKE_ALL_OTHER_SESSIONS_MUTATION,
} from '../graphql/operations';
import type { ActiveSession } from '../types';

type SessionsCache = { myActiveSessions: ActiveSession[] };

export const useSessionManagement = () => {
  const { data, loading, error, refetch } = useQuery<SessionsCache>(MY_ACTIVE_SESSIONS_QUERY);
  const [revokeSessionMutation] = useMutation(REVOKE_SESSION_MUTATION);
  const [revokeAllOtherSessionsMutation] = useMutation(REVOKE_ALL_OTHER_SESSIONS_MUTATION);

  const revokeSession = useCallback(
    async (sessionId: string) => {
      try {
        await revokeSessionMutation({
          variables: { sessionId },
          optimisticResponse: { revokeSession: true },
          update: (cache: ApolloCache) => {
            const existingData = cache.readQuery<SessionsCache>({
              query: MY_ACTIVE_SESSIONS_QUERY,
            });
            if (existingData) {
              cache.writeQuery<SessionsCache>({
                query: MY_ACTIVE_SESSIONS_QUERY,
                data: {
                  myActiveSessions: existingData.myActiveSessions.filter(
                    (s) => s.sessionId !== sessionId,
                  ),
                },
              });
            }
          },
        });
        toast.success('Session revoked');
      } catch {
        toast.error('Failed to revoke session');
      }
    },
    [revokeSessionMutation],
  );

  const revokeAllOtherSessions = useCallback(async () => {
    try {
      await revokeAllOtherSessionsMutation({
        update: (cache: ApolloCache) => {
          const existingData = cache.readQuery<SessionsCache>({
            query: MY_ACTIVE_SESSIONS_QUERY,
          });
          if (existingData) {
            cache.writeQuery<SessionsCache>({
              query: MY_ACTIVE_SESSIONS_QUERY,
              data: {
                myActiveSessions: existingData.myActiveSessions.filter(
                  (s: ActiveSession) => s.isCurrent,
                ),
              },
            });
          }
        },
      });
      toast.success('All other sessions signed out');
    } catch {
      toast.error('Failed to revoke other sessions');
    }
  }, [revokeAllOtherSessionsMutation]);

  return {
    sessions: data?.myActiveSessions,
    loading,
    error,
    revokeSession,
    revokeAllOtherSessions,
    refetch,
  };
};
