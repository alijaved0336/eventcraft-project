import React from 'react';
import { Loader2, Monitor, Smartphone, Globe, ShieldCheck } from 'lucide-react';
import { UAParser } from 'ua-parser-js';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation } from '@apollo/client/react';
import { ApolloCache, CombinedGraphQLErrors } from '@apollo/client';
import Button from '@/components/ui/button';
import {
  MY_ACTIVE_SESSIONS_QUERY,
  REVOKE_SESSION_MUTATION,
  REVOKE_ALL_OTHER_SESSIONS_MUTATION,
} from '../../graphql/operations';
import type { ActiveSession } from '../../types';
import { toast } from 'sonner';

type SessionsCache = { myActiveSessions: ActiveSession[] };

/**
 * Section to manage active login sessions and device security.
 */
const SecuritySection: React.FC = () => {
  const { data, loading, refetch } = useQuery<SessionsCache>(MY_ACTIVE_SESSIONS_QUERY);

  const [revokeSession] = useMutation(REVOKE_SESSION_MUTATION);
  const [revokeAllOthers] = useMutation(REVOKE_ALL_OTHER_SESSIONS_MUTATION);

  const handleRevoke = async (sessionId: string) => {
    try {
      await revokeSession({
        variables: { sessionId },
        update: (cache: ApolloCache) => {
          const existing = cache.readQuery<SessionsCache>({ query: MY_ACTIVE_SESSIONS_QUERY });
          if (existing) {
            cache.writeQuery<SessionsCache>({
              query: MY_ACTIVE_SESSIONS_QUERY,
              data: {
                myActiveSessions: existing.myActiveSessions.filter(
                  (s: ActiveSession) => s.sessionId !== sessionId,
                ),
              },
            });
          }
        },
      });
      toast.success('Session revoked');
      refetch();
    } catch (err) {
      let message = 'Failed to revoke session';
      if (CombinedGraphQLErrors.is(err)) {
        message = err.errors[0]?.message ?? err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      toast.error(message);
    }
  };

  const handleRevokeAllOthers = async () => {
    try {
      await revokeAllOthers();
      toast.success('All other sessions revoked');
      refetch();
    } catch (err) {
      let message = 'Failed to revoke sessions';
      if (CombinedGraphQLErrors.is(err)) {
        message = err.errors[0]?.message ?? err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
      </div>
    );
  }

  const sessions = data?.myActiveSessions ?? [];

  const getDeviceIcon = (userAgent: string) => {
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    if (device.type === 'mobile' || device.type === 'tablet')
      return <Smartphone className="w-5 h-5 text-slate-400" />;
    return <Monitor className="w-5 h-5 text-slate-400" />;
  };

  const getDeviceLabel = (userAgent: string) => {
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    return `${browser.name ?? 'Unknown Browser'} on ${os.name ?? 'Unknown OS'}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Active Sessions</h3>
          <p className="text-sm text-on-surface-variant">
            Devices currently logged into your account.
          </p>
        </div>
        {sessions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevokeAllOthers}
            className="text-red-500 hover:text-red-600 border-red-100 hover:bg-red-50"
          >
            Sign out all others
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {sessions.map((session: ActiveSession) => (
          <div
            key={session.sessionId}
            className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between group transition-all hover:shadow-md hover:border-primary/10"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 transition-colors group-hover:bg-primary/5">
                {getDeviceIcon(session.userAgent)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-on-surface text-sm">
                    {getDeviceLabel(session.userAgent)}
                  </p>
                  {session.isCurrent && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase">
                      Current Device
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-on-surface-variant font-medium">
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {session.ip}
                  </div>
                  <span className="opacity-20">•</span>
                  <span>Active {formatDistanceToNow(new Date(session.lastUsedAt))} ago</span>
                </div>
              </div>
            </div>

            {!session.isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevoke(session.sessionId)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
              >
                Sign out
              </Button>
            )}

            {session.isCurrent && (
              <div className="p-1 px-2 rounded-full border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/30">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
            )}
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-on-surface-variant text-sm">No active sessions found.</p>
        </div>
      )}
    </div>
  );
};

export default SecuritySection;
