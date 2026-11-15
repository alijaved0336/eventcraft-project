import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';
import { VirtualSession } from '../types';
import DailyIframe, { type DailyCall, type DailyEventObject } from '@daily-co/daily-js';
import { toast } from 'sonner';
import { GET_EVENT_LIVESTREAM_DETAILS, TOGGLE_LIVESTREAM } from '../graphql/operations';
import { livestreamApi } from '@/api/livestreamApi';
import Button from '@/components/ui/button';
import LoadingOverlay from '@/components/ui/loading-overlay';
import { Modal } from '@/components/ui/modal';
import { AlertTriangle, LogOut } from 'lucide-react';

const LivestreamDashboard: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<DailyCall | null>(null);

  const [participantsCount, setParticipantsCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const initializingRef = useRef(false);

  const { data, loading, error } = useQuery<{
    event: { id: string; title: string; virtualSession: VirtualSession };
  }>(GET_EVENT_LIVESTREAM_DETAILS, {
    variables: { id: eventId },
    skip: !eventId,
  });

  const apolloClient = useApolloClient();
  const [toggleLive] = useMutation<{ toggleLivestream: { id: string; isLive: boolean } }>(
    TOGGLE_LIVESTREAM,
  );

  const event = data?.event;
  const virtualSession = event?.virtualSession;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        console.log('Destroying Daily call frame');
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, []);

  // Initialize Daily Room
  const initCall = useCallback(async (hostUrl: string) => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      // If a frame already exists, destroy it before re-initializing (critical for resets)
      if (callFrameRef.current) {
        console.log('Destroying existing call frame...');
        await callFrameRef.current.destroy();
        callFrameRef.current = null;
      }

      // ❗ CRITICAL: Re-check if container is still present after async destroy
      if (!videoContainerRef.current) {
        console.warn('Initialization aborted: videoContainerRef is null after cleanup.');
        return;
      }

      // Clear any potential stale content
      videoContainerRef.current.innerHTML = '';

      // Robust Token Extraction
      const urlObj = new URL(hostUrl);
      const token = urlObj.searchParams.get('t');
      const roomUrl = `${urlObj.origin}${urlObj.pathname}`;

      console.log('Initializing Studio with room:', roomUrl, 'Token present:', !!token);

      const frame = DailyIframe.createFrame(videoContainerRef.current, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '12px',
        },
        showLeaveButton: true,
        showFullscreenButton: true,
      });

      callFrameRef.current = frame;

      frame
        .on('joined-meeting', (e: DailyEventObject) => {
          console.log('Joined meeting successfully', e);
          setParticipantsCount(Object.keys(frame.participants()).length);
          setIsRecovering(false);
        })
        .on('participant-joined', () => {
          setParticipantsCount(Object.keys(frame.participants()).length);
        })
        .on('participant-left', () => {
          setParticipantsCount(Object.keys(frame.participants()).length);
        })
        .on('error', (e: DailyEventObject) => {
          console.error('Daily Studio Error:', e);
          // Handle 404 / Missing room specifically for self-healing
          if (e.errorMsg?.includes('does not exist') || e.errorMsg?.includes('not found')) {
            setIsRecovering(true);
            toast.error('This room seems to have expired or does not exist.');
            if (callFrameRef.current) {
              callFrameRef.current.destroy();
              callFrameRef.current = null;
            }
          } else {
            toast.error(`Streaming error: ${e.errorMsg}`);
          }
        });

      await frame.join({ url: roomUrl, token: token || '' });
    } catch (err: unknown) {
      // Daily's join() promise rejects with the exact same payload fired by the 'error' event.
      // Since our .on('error') subscriber already handled it and provided the correct UI feedback,
      // we can safely suppress this redundant Promise rejection to prevent duplicate toasts.
      const isDailyEventError =
        err && typeof err === 'object' && (err as Record<string, unknown>).action === 'error';
      if (isDailyEventError) {
        console.warn('Suppressing duplicate network rejection already handled by event listener.');
        return;
      }

      // If the container is no longer in the DOM or unmounted via self-healing, suppress the secondary error.
      if (!videoContainerRef.current || !videoContainerRef.current.isConnected) {
        console.warn('Suppressing initialization error (container unmounted):', err);
        return;
      }

      console.error('Failed to initialize studio:', err);
      toast.error('Failed to initialize virtual studio components');
    } finally {
      initializingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (virtualSession?.hostUrl && !callFrameRef.current && videoContainerRef.current) {
      initCall(virtualSession.hostUrl);
    }
  }, [virtualSession?.hostUrl, initCall]);

  const isLive = virtualSession?.isLive || false;

  // Duration Timer
  useEffect(() => {
    let interval: number | undefined;
    if (isLive) {
      interval = window.setInterval(() => setStreamDuration((d) => d + 1), 1000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isLive]);

  const handleConnect = async (force: boolean = false) => {
    if (!eventId) return;
    try {
      const newSession = await livestreamApi.connect(eventId, force);

      if (newSession?.hostUrl) {
        setIsRecovering(false);
        initCall(newSession.hostUrl);

        // Notify Apollo that the event details should be refetched
        apolloClient.refetchQueries({
          include: [GET_EVENT_LIVESTREAM_DETAILS],
        });

        toast.success(
          force
            ? 'Room successfully reset and re-initialized'
            : 'Virtual room connected successfully',
        );
      }
    } catch (err: unknown) {
      console.error('Connect failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to connect room';
      toast.error(message);
    }
  };

  const handleToggleLive = async () => {
    try {
      const newLiveState = !isLive;
      await toggleLive({
        variables: { eventId, isLive: newLiveState },
        refetchQueries: [{ query: GET_EVENT_LIVESTREAM_DETAILS, variables: { id: eventId } }],
      });
      toast.success(newLiveState ? 'Stream is now LIVE!' : 'Stream paused');
    } catch {
      toast.error('Failed to toggle live status');
    }
  };

  const handleEndSession = () => setIsEndModalOpen(true);

  const confirmEndSession = async () => {
    if (!eventId) return;
    try {
      await livestreamApi.end(eventId);
      if (callFrameRef.current) {
        callFrameRef.current.leave();
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
      toast.success('Session ended');
      setIsEndModalOpen(false);
      navigate(`/events/${eventId}`);
    } catch {
      toast.error('Failed to end session');
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <LoadingOverlay isVisible={loading} message="Loading studio..." />;
  if (error)
    return (
      <div className="p-20 text-center text-white">
        Error loading studio details. Please try refreshing.
      </div>
    );

  return (
    <>
      <div className="h-full bg-[#F8FAFC] text-slate-900 font-inter flex flex-col antialiased overflow-hidden">
        {/* Header / Top Control Bar */}
        <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <span
                className="material-symbols-outlined text-indigo-600"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                videocam
              </span>
            </div>
            <div>
              <h1 className="text-sm font-bold truncate max-w-[200px] text-slate-900">
                {event?.title}
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                Live Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {isLive && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-full">
                <span className="size-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">
                  Live • {formatDuration(streamDuration)}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">group</span>
                <span className="text-[10px] font-bold">{participantsCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">signal_cellular_alt</span>
                <span className="text-[10px] font-bold">HD</span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2"></div>

            <div className="flex items-center gap-2">
              {!virtualSession ? (
                <Button
                  onClick={() => handleConnect(false)}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-6"
                >
                  Initialize Room
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleToggleLive}
                    variant={isLive ? 'outline' : 'primary'}
                    size="sm"
                    className={`text-xs px-6 ${isLive ? 'border-red-500 text-red-500 hover:bg-red-50' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                    disabled={isRecovering}
                  >
                    {isLive ? 'End Stream' : 'Go Live'}
                  </Button>
                  <Button
                    onClick={handleEndSession}
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs"
                  >
                    Close Room
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Studio Area */}
        <main className="flex-1 p-6 flex flex-col overflow-hidden">
          {/* Main Feed: Video Stream */}
          <div className="flex-1 flex flex-col h-full w-full">
            {virtualSession && !isRecovering ? (
              <div className="relative flex-1 bg-slate-900 rounded-[32px] border border-slate-200 overflow-hidden shadow-xl flex items-center justify-center p-0">
                <div ref={videoContainerRef} className="absolute inset-0" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto w-full">
                <div className="max-w-6xl mx-auto w-full p-6 md:p-12">
                  <header className="mb-10">
                    <div className="flex items-center gap-3 text-indigo-600 font-bold text-[0.75rem] uppercase tracking-widest mb-3">
                      <span className="w-8 h-[2px] bg-indigo-600"></span>
                      Event Management
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                      Broadcast Setup.
                    </h1>
                  </header>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <section className="lg:col-span-8">
                      {isRecovering ? (
                        <section className="lg:col-span-8">
                          <div className="p-12 rounded-2xl shadow-xl shadow-slate-200/50 bg-white border border-slate-100 relative overflow-hidden group">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100/50 transition-colors duration-700"></div>
                            <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto py-8">
                              <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                <span
                                  className="material-symbols-outlined text-indigo-600 text-4xl"
                                  // style="font-variation-settings: 'FILL' 1;"
                                >
                                  videocam
                                </span>
                              </div>
                              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
                                Virtual Room
                              </h2>
                              <div className="bg-slate-100 px-4 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">
                                Status: Not Initialized
                              </div>
                              <p className="text-slate-600 leading-relaxed mb-10 text-lg">
                                Ready to go live? Create a high-fidelity virtual space for your
                                attendees. We use{' '}
                                <span className="text-indigo-600 font-bold">Daily.co</span> to
                                provide ultra-low latency streaming, HD recording, and interactive
                                stage management.
                              </p>
                              <div className="flex flex-col w-full gap-4">
                                <button
                                  onClick={() => handleConnect(true)}
                                  className="w-full py-4 px-8 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                  <span className="material-symbols-outlined">add_circle</span>
                                  Create Virtual Room
                                </button>
                                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                                  Powered by Enterprise WebRTC
                                </p>
                              </div>
                            </div>
                          </div>
                        </section>
                      ) : (
                        // <div className="p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 bg-white border border-slate-100 relative overflow-hidden group">
                        //   {/* Ambient glow */}
                        //   <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-50 rounded-full blur-3xl group-hover:bg-amber-100/50 transition-colors duration-700"></div>

                        //   <div className="relative z-10 flex flex-col pt-4 pb-2 w-full text-center items-center">
                        //     <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                        //       <span
                        //         className="material-symbols-outlined text-amber-600 text-4xl font-bold"
                        //         style={{ fontVariationSettings: "'FILL' 1" }}
                        //       >
                        //         sync_problem
                        //       </span>
                        //     </div>

                        //     <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
                        //       Connection Broken
                        //     </h2>
                        //     <div className="bg-slate-100 px-4 py-1 rounded-full text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-6">
                        //       Status: Error Expired
                        //     </div>

                        //     <p className="text-slate-600 leading-relaxed mb-10 text-lg max-w-lg">
                        //       This room session has expired or was removed. Re-provision a brand-new
                        //       unique room immediately to resume streaming.
                        //     </p>

                        //     <div className="flex flex-col w-full gap-4 max-w-lg">
                        //       <Button
                        //         onClick={() => handleConnect(true)}
                        //         className="w-full py-4 px-8 bg-amber-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-amber-200 hover:bg-amber-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        //       >
                        //         <span className="material-symbols-outlined">build</span>
                        //         Fix Connection
                        //       </Button>
                        //       <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                        //         Powered by Enterprise WebRTC
                        //       </p>
                        //     </div>
                        //   </div>
                        // </div>
                        <div className="p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 bg-white border border-slate-100 relative overflow-hidden group">
                          {/* Ambient glow */}
                          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100/50 transition-colors duration-700"></div>

                          <div className="relative z-10 flex flex-col pt-4 pb-2 w-full text-center items-center">
                            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                              <span
                                className="material-symbols-outlined text-indigo-600 text-4xl"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                videocam
                              </span>
                            </div>

                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
                              Virtual Room
                            </h2>
                            <div className="bg-slate-100 px-4 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">
                              Status: Not Initialized
                            </div>

                            <p className="text-slate-600 leading-relaxed mb-10 text-lg max-w-lg">
                              Ready to go live? Create a high-fidelity virtual space for your
                              attendees. We use{' '}
                              <span className="text-indigo-600 font-bold">Daily.co</span> to provide
                              ultra-low latency streaming, HD recording, and interactive stage
                              management.
                            </p>

                            <div className="flex flex-col w-full gap-4 max-w-lg">
                              <Button
                                onClick={() => handleConnect(false)}
                                className="w-full py-4 px-8 bg-indigo-600 border-0 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                              >
                                <span className="material-symbols-outlined">add_circle</span>
                                Create Virtual Room
                              </Button>
                              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                                Powered by Enterprise WebRTC
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </section>

                    <aside className="lg:col-span-4 space-y-6">
                      <div className="p-8 rounded-3xl border bg-white border-slate-100 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
                          What's included?
                        </h3>
                        <ul className="space-y-5">
                          <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-indigo-500 text-xl">
                              check_circle
                            </span>
                            <div className="text-sm">
                              <p className="font-bold text-slate-900">4K Video Quality</p>
                              <p className="text-slate-500 text-xs mt-0.5">
                                Crystal clear delivery to every viewer.
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-indigo-500 text-xl">
                              check_circle
                            </span>
                            <div className="text-sm">
                              <p className="font-bold text-slate-900">Unlimited Viewers</p>
                              <p className="text-slate-500 text-xs mt-0.5">
                                Scale your event without limits.
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-indigo-500 text-xl">
                              check_circle
                            </span>
                            <div className="text-sm">
                              <p className="font-bold text-slate-900">Auto-Recording</p>
                              <p className="text-slate-500 text-xs mt-0.5">
                                Instant playback for all attendees.
                              </p>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </aside>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <Modal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        className="max-w-md p-0 overflow-hidden bg-white border-slate-200"
      >
        <div className="relative p-8 text-center">
          {/* Decorative Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-50 blur-3xl -z-10 rounded-full" />

          {/* Icon Header */}
          <div className="size-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm mx-auto">
            <AlertTriangle className="size-10 text-red-500" />
          </div>

          {/* Content */}
          <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">End Broadcast?</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-10 max-w-[280px] mx-auto font-medium">
            This will disconnect everyone and permanently end the session. This action cannot be
            undone.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={confirmEndSession}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-6 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 group"
            >
              <LogOut className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              End Session for All
            </Button>
            <Button
              onClick={() => setIsEndModalOpen(false)}
              variant="ghost"
              className="w-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest"
            >
              Keep Broadcasting
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LivestreamDashboard;
