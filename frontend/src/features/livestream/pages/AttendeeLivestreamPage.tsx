import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { VirtualSession } from '../types';
import DailyIframe, { type DailyCall, type DailyEventObject } from '@daily-co/daily-js';
import { toast } from 'sonner';
import { GET_EVENT_LIVESTREAM_DETAILS } from '../graphql/operations';
import LoadingOverlay from '@/components/ui/loading-overlay';
import Button from '@/components/ui/button';

import { livestreamApi } from '@/api/livestreamApi';

const AttendeeLivestreamPage: React.FC = () => {
  const { eventId, issuanceId } = useParams<{ eventId: string; issuanceId: string }>();
  const callFrameRef = useRef<DailyCall | null>(null);

  const [isJoining, setIsJoining] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [isFrameMounted, setIsFrameMounted] = useState(false);

  // 1. Immediate Session Details (Polling every 3s)
  const {
    data: sessData,
    loading: sessLoading,
    error: sessError,
  } = useQuery<{ event: { id: string; title: string; virtualSession: VirtualSession } }>(
    GET_EVENT_LIVESTREAM_DETAILS,
    {
      variables: { id: eventId },
      skip: !eventId,
    },
  );

  // 2. Optimized Token Fetching (REST API)
  const [tokenData, setTokenData] = useState<{ token: string } | null>(null);
  const [tokenError, setTokenError] = useState<Error | null>(null);

  const fetchToken = useCallback(async () => {
    if (!eventId || !issuanceId) return;
    try {
      const data = await livestreamApi.getAttendeeToken(eventId, issuanceId);
      setTokenData(data);
      setTokenError(null);
    } catch (err) {
      setTokenError(err instanceof Error ? err : new Error('Failed to fetch join token'));
    }
  }, [eventId, issuanceId]);

  useEffect(() => {
    const doFetch = async () => {
      await fetchToken();
    };
    doFetch();
  }, [fetchToken]);

  const refetchToken = () => fetchToken();

  const virtualSession = sessData?.event?.virtualSession;
  const joinToken = tokenData?.token;

  // Cleanup Daily on unmount
  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        console.log('Cleaning up attendee frame');
        callFrameRef.current.destroy();
        callFrameRef.current = null;
        setIsFrameMounted(false);
      }
    };
  }, []);

  // 3. Robust Join Logic
  const handleJoinCall = useCallback(
    async (container: HTMLDivElement) => {
      if (callFrameRef.current || !virtualSession?.joinUrl || !joinToken) return;

      setIsJoining(true);
      console.log('Initializing in-app call view...');

      try {
        const frame = DailyIframe.createFrame(container, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '24px',
          },
          showLeaveButton: true,
          showFullscreenButton: true,
          theme: {
            colors: {
              accent: '#6366f1',
              accentText: '#ffffff',
              background: '#0f172a',
              backgroundAccent: '#1e293b',
              baseText: '#f8fafc',
              border: '#334155',
              mainAreaBg: '#0f172a',
            },
          },
        });

        callFrameRef.current = frame;
        setIsFrameMounted(true);

        frame
          .on('joined-meeting', (e: DailyEventObject) => {
            console.log('Joined in-app successfully', e);
            setParticipantsCount(Object.keys(frame.participants()).length);
            setIsJoining(false);
          })
          .on('participant-joined', () => {
            setParticipantsCount(Object.keys(frame.participants()).length);
          })
          .on('participant-left', () => {
            setParticipantsCount(Object.keys(frame.participants()).length);
          })
          .on('error', (e: DailyEventObject) => {
            console.error('In-app call error:', e);
            // If the meeting is not found, the organizer might have reset it
            if (e.errorMsg?.includes('not exist') || e.errorMsg?.includes('not found')) {
              toast.error('The live room is being reset by the organizer. Reconnecting...');
              frame.destroy();
              callFrameRef.current = null;
              setIsFrameMounted(false);
            } else {
              toast.error(`In-app call error: ${e.errorMsg}`);
            }
          });

        await frame.join({ url: virtualSession.joinUrl, token: joinToken });
      } catch (err) {
        console.error('Failed to mount join view:', err);
        setIsJoining(false);
      }
    },
    [virtualSession, joinToken],
  );

  // 4. Callback Ref for instant mounting
  const setVideoContainer = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && virtualSession?.isLive && !callFrameRef.current && joinToken) {
        handleJoinCall(node);
      }
    },
    [virtualSession?.isLive, joinToken, handleJoinCall],
  );

  if (sessLoading && !sessData)
    return <LoadingOverlay isVisible={sessLoading} message="Preparing room..." />;
  if (sessError)
    return (
      <div className="p-20 text-center text-white">
        Unable to load event stream. Please try refreshing the page.
      </div>
    );

  // Handle Authorization issues
  const isNotInitialized = tokenError?.message.includes('not initialized');

  if (tokenError && !isNotInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white antialiased">
        <div className="size-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-8">
          <span className="material-symbols-outlined text-red-500 text-5xl">lock</span>
        </div>
        <h1 className="text-3xl font-black mb-4">Secured Virtual Session</h1>
        <p className="text-slate-400 max-w-sm mb-10 text-lg leading-relaxed">
          This session is exclusive to ticket holders. If you have a ticket and believe this is an
          error, please check your connection and try again.
        </p>
        {tokenError && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-mono max-w-md break-all">
            Debug Error: {tokenError.message}
          </div>
        )}
        <div className="flex flex-col gap-4 items-center">
          <Button
            onClick={() => refetchToken()}
            className="bg-white text-slate-950 hover:bg-slate-200 px-12 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs"
          >
            Try Re-connecting
          </Button>
          <Link
            to={`/events/${eventId}`}
            className="text-slate-500 hover:text-white text-xs font-bold underline underline-offset-8 transition-colors"
          >
            Purchase or View Ticket
          </Link>
        </div>
      </div>
    );
  }

  // Handle Room Not Initialized yet (Waiting for organizer)
  if (!virtualSession || isNotInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white antialiased">
        <div className="size-24 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 mb-8">
          <span className="material-symbols-outlined text-indigo-500 text-5xl animate-pulse">
            settings_input_component
          </span>
        </div>
        <h1 className="text-3xl font-black mb-4">Studio Not Ready</h1>
        <p className="text-slate-400 max-w-sm mb-10 text-lg leading-relaxed">
          The event organizer hasn't initialized the virtual studio yet. We're getting things ready
          for you!
        </p>
        <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
          <span className="size-2 bg-indigo-500 rounded-full animate-ping"></span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Waiting for Broadcast...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 text-white font-inter flex flex-col antialiased overflow-hidden">
      <header className="fixed top-0 left-0 right-0 h-20 px-8 flex items-center justify-between z-50 bg-slate-950/50 backdrop-blur-md border-b border-white/5 shrink-0 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <Link
            to={`/events/${eventId}`}
            className="size-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-400">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-sm font-bold tracking-tight">{sessData?.event?.title}</h1>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-widest border border-indigo-500/20 rounded">
                In-App Live Room
              </span>
              <span className="text-[10px] text-slate-500 font-bold">• HD Call Enabled</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full pointer-events-auto">
          <span className="size-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
            Live • {participantsCount} online
          </span>
        </div>
      </header>

      <main className="flex-1 p-6 pt-24 flex flex-col overflow-hidden relative">
        <div className="relative flex-1 bg-slate-900 rounded-[32px] border border-white/5 overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex items-center justify-center p-0">
          {virtualSession?.isLive ? (
            <div
              ref={setVideoContainer}
              className="absolute inset-0 flex items-center justify-center"
            >
              {!isFrameMounted && (
                <div className="text-center space-y-6">
                  <div className="size-20 bg-indigo-500/20 rounded-full mx-auto flex items-center justify-center border border-indigo-500/30">
                    <span className="material-symbols-outlined text-3xl text-indigo-400 animate-pulse">
                      video_chat
                    </span>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold">Room is Open</h3>
                    <p className="text-sm text-slate-400 max-w-[240px] mx-auto">
                      Click below to enter the live call and interact with the host.
                    </p>
                    <Button
                      onClick={() => {
                        // Re-mount manually if callback didn't fire or was blocked
                        const container = document.querySelector('.absolute.inset-0');
                        if (container instanceof HTMLDivElement) handleJoinCall(container);
                      }}
                      isLoading={isJoining}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-indigo-500/20"
                    >
                      Join Call Now
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-8 max-w-md p-10 z-10">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                <div className="relative size-32 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
                  <span className="material-symbols-outlined text-5xl text-primary animate-pulse">
                    broadcast_on_personal
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black mb-3">Live stream will begin soon</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  The event organizer is preparing the room. We will automatically connect you once
                  the broadcast begins.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="h-12 px-8 flex items-center justify-between text-slate-600 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">
          EventCraft In-App Call View
        </p>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Powered by Daily.co</p>
      </footer>
    </div>
  );
};

export default AttendeeLivestreamPage;
