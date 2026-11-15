import React, { useEffect } from 'react';
import { TicketIssuance } from '../types';

interface CheckInCelebrationProps {
  ticket: TicketIssuance;
  onDismiss: () => void;
}

const CheckInCelebration: React.FC<CheckInCelebrationProps> = ({ ticket, onDismiss }) => {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () =>
      setTimeout(() => {
        onDismiss();
      }, 4000); // duplicated logic for safety in mock
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-on-background/40 backdrop-blur-sm"
        onClick={onDismiss}
      ></div>
      <div className="relative w-full max-w-sm bg-linear-to-br from-primary-container to-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Top Decoration */}
        <div className="h-32 bg-primary flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white/20 animate-ping"></div>
          </div>
          <span
            className="material-symbols-outlined text-white text-6xl relative z-10 animate-bounce"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>

        <div className="p-8 text-center">
          <h2 className="text-2xl font-black text-on-surface mb-2">Check-in Success!</h2>
          <p className="text-sm text-on-surface-variant mb-6">Welcome to the event.</p>

          <div className="bg-surface-container-low rounded-xl p-4 text-left mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
              Attendee
            </p>
            <p className="font-bold text-on-surface truncate">{ticket.attendeeName}</p>
            <div className="h-px w-full bg-outline-variant/10 my-3"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
              Pass Type
            </p>
            <p className="font-bold text-on-surface">{ticket.ticketType?.name || 'TICKET'}</p>
          </div>

          <button
            onClick={onDismiss}
            className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg active:scale-95 transition-transform"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInCelebration;
