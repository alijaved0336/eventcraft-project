import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client/react';
import { MANUAL_CHECK_IN, UNDO_CHECK_IN, GET_EVENT_STATS_V2 } from '../graphql/operations';
import { CheckInResult, AttendanceStatsV2 } from '../../tickets/types';
import { toast } from 'sonner';

const StaffCheckInPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [lastCheckIn, setLastCheckIn] = useState<{ id: string; name: string } | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [manualToken, setManualToken] = useState('');

  const { data: statsData } = useQuery<{ getAttendanceStats: AttendanceStatsV2 }>(
    GET_EVENT_STATS_V2,
    {
      variables: { eventId },
      skip: !eventId,
    },
  );

  const [checkIn] = useMutation<{ checkInManual: CheckInResult }>(MANUAL_CHECK_IN, {
    onCompleted: (data) => {
      const result = data?.checkInManual;
      if (result?.__typename === 'CheckInSuccess') {
        toast.success(`Checked in ${result.attendee.fullName}`);
        setLastCheckIn({ id: result.attendee.id, name: result.attendee.fullName });
        setShowUndo(true);
        setManualToken('');
      } else if (result?.__typename === 'CheckInError') {
        toast.error(result.message || 'Check-in failed');
      }
    },
  });

  const [undo] = useMutation(UNDO_CHECK_IN, {
    onCompleted: () => {
      toast.success('Check-in undone');
      setShowUndo(false);
      setLastCheckIn(null);
    },
  });

  useEffect(() => {
    if (showUndo) {
      const timer = setTimeout(() => setShowUndo(false), 300000); // 5 minutes
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showUndo]);

  const stats = statsData?.getAttendanceStats;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans antialiased">
      {/* Dynamic Header */}
      <header className="px-6 py-8 flex items-center justify-between z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border"
        >
          <span className="material-symbols-outlined text-muted-foreground">arrow_back</span>
        </button>
        <div className="text-center">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
            Live Check-in
          </h2>
          <p className="text-sm font-bold tracking-tight text-foreground">Gate Protocol Alpha</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <span className="text-[10px] font-black text-primary">
            {Math.round(((stats?.checkedIn ?? 0) / (stats?.total ?? 1)) * 100)}%
          </span>
        </div>
      </header>

      {/* Viewfinder Section */}
      <main className="flex-1 relative flex flex-col items-center justify-center px-8">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent opacity-50"></div>

        {/* Scanner Brackets */}
        <div className="relative w-full aspect-square max-w-[280px] mb-12">
          {/* Top-left */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-2xl"></div>
          {/* Top-right */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-2xl"></div>
          {/* Bottom-left */}
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-2xl"></div>
          {/* Bottom-right */}
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-2xl"></div>

          <div className="absolute inset-4 overflow-hidden rounded-xl bg-muted/30 backdrop-blur-sm border border-border flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-primary/10 text-6xl animate-pulse">
              qr_code_scanner
            </span>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/50 animate-scan shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
          </div>
        </div>

        {/* Manual Input Area */}
        <div className="w-full max-w-sm space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="MANUAL TICKET ID"
              className="w-full bg-muted/50 border-2 border-border rounded-2xl py-4 px-6 text-center text-sm font-black tracking-widest focus:border-primary/50 focus:bg-muted outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && checkIn({ variables: { issuanceId: manualToken } })
              }
            />
            <button
              onClick={() => checkIn({ variables: { issuanceId: manualToken } })}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-widest">
            Awaiting optical data or identification...
          </p>
        </div>
      </main>

      {/* Undo Feedback Hub (Sticks to bottom) */}
      <footer className="px-6 py-10">
        {showUndo && lastCheckIn ? (
          <div className="bg-primary/10 backdrop-blur-xl border border-primary/20 p-5 rounded-3xl flex items-center justify-between animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-foreground">person</span>
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-primary">
                  ACCESS GRANTED
                </h4>
                <p className="text-sm font-bold text-foreground">{lastCheckIn.name}</p>
              </div>
            </div>
            <button
              onClick={() => undo({ variables: { ticketIssuanceId: lastCheckIn.id } })}
              className="px-6 py-3 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
            >
              Undo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-3xl border border-border">
              <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Session</p>
              <p className="text-lg font-black text-foreground">{stats?.checkedIn || 0}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-3xl border border-border">
              <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Target</p>
              <p className="text-lg font-black text-foreground">{stats?.total || 0}</p>
            </div>
          </div>
        )}
      </footer>

      {/* Scan Animation Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(240px); opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `,
        }}
      />
    </div>
  );
};

export default StaffCheckInPage;
