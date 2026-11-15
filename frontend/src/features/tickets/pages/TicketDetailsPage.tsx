import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_MY_TICKET_DETAIL } from '../graphql/operations';
import { CHECK_IN_ATTENDEE } from '../../checkin/graphql/operations';
import { TicketIssuance, CheckInResult } from '../types';
import CheckInCelebration from '../components/CheckInCelebration';
import SwipeToCheckIn from '../components/SwipeToCheckIn';
import { useSecureQRCode } from '../hooks/useSecureQRCode';
import { toast } from 'sonner';

const TicketDetailsPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();

  const { data, loading, error, refetch } = useQuery<{ myTicket: TicketIssuance }>(
    GET_MY_TICKET_DETAIL,
    {
      variables: { issuanceId: ticketId },
    },
  );

  const [checkInAttendee, { loading: checkInLoading }] = useMutation<{
    checkInAttendee: CheckInResult;
  }>(CHECK_IN_ATTENDEE, {
    onCompleted: (data) => {
      if (data.checkInAttendee.__typename === 'CheckInSuccess') {
        toast.success(`Welcome to the event!`);
        refetch();
      } else {
        toast.error(data.checkInAttendee.message || 'Check-in failed');
      }
    },
  });

  const ticket = data?.myTicket;
  const event = ticket?.event;

  const { qrBlobUrl, isLoading: isLoadingQr } = useSecureQRCode(ticketId);

  const [prevTicketStatus, setPrevTicketStatus] = useState<string | undefined>(ticket?.status);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleSelfCheckIn = () => {
    if (!ticket || !event) return;

    checkInAttendee({
      variables: {
        input: {
          eventId: event.id,
          qrToken: ticketId, // Using issuanceId as the check-in token
          method: 'self',
        },
      },
    });
  };

  if (loading && !ticket)
    return (
      <div className="flex h-screen items-center justify-center">Loading ticket details...</div>
    );
  if (error || !ticket)
    return (
      <div className="flex h-screen items-center justify-center text-error">Ticket not found</div>
    );

  const isCheckedIn = ticket.status === 'checked_in';

  if (ticket && prevTicketStatus !== ticket.status) {
    if (prevTicketStatus !== 'checked_in' && ticket.status === 'checked_in') {
      setShowCelebration(true);
    }
    setPrevTicketStatus(ticket.status);
  }

  return (
    <>
      <main className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
        {/* Ticket Card */}
        <div className="relative overflow-hidden bg-card rounded-2xl shadow-2xl shadow-primary/5 flex flex-col border border-border">
          {/* Event Banner Image */}
          <div className="relative h-48 w-full overflow-hidden">
            <img
              className="w-full h-full object-cover"
              src={
                event?.bannerImage ||
                'https://images.unsplash.com/photo-1540575861501-7ad05823c23d?q=80&w=2070&auto=format&fit=crop'
              }
              alt={event?.title || 'Event'}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <span
                className={`inline-block px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest mb-2 ${isCheckedIn ? 'bg-green-600' : 'bg-primary'}`}
              >
                {isCheckedIn ? 'Checked In' : 'Confirmed'}
              </span>
              <h2 className="text-white font-headline text-lg font-bold leading-tight">
                {event?.title}
              </h2>
            </div>
          </div>

          {/* Event Details */}
          <div className="p-5 flex flex-col gap-3 bg-card">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
                calendar_today
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Date & Time
                </p>
                <p className="text-sm font-bold text-foreground">
                  {event?.startDate
                    ? new Date(event.startDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'TBD'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {event?.startDate
                    ? new Date(event.startDate).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
                location_on
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Venue
                </p>
                <p className="text-sm font-bold text-foreground">
                  {event?.location?.address || event?.location?.city || 'TBD'}
                </p>
              </div>
            </div>
          </div>

          {/* Decorative Perforation Line */}
          <div className="relative h-6 flex items-center px-4 bg-card">
            <div className="absolute -left-3 w-6 h-6 bg-background border border-border rounded-full"></div>
            <div className="w-full border-t border-dashed border-border"></div>
            <div className="absolute -right-3 w-6 h-6 bg-background border border-border rounded-full"></div>
          </div>

          {/* QR Code Section */}
          <div className="p-6 flex flex-col items-center bg-card relative">
            <div className="mb-4 flex flex-col items-center">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-4">
                {ticket.ticketType?.name || 'TICKET'}
              </span>
              <div className="p-4 bg-white border border-border rounded-2xl shadow-sm relative">
                {isLoadingQr ? (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : qrBlobUrl ? (
                  <img alt="QR Code" className="w-48 h-48" src={qrBlobUrl} />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center border-4 border-muted rounded-xl">
                    <span className="material-symbols-outlined text-6xl text-primary">
                      qr_code_2
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-4 font-mono text-sm tracking-tighter text-muted-foreground font-bold">
                #EC-{ticket.ticketNumber}
              </p>
            </div>

            {/* Checked-In Overlay overlaying the QR code ONLY when checked in */}
            {isCheckedIn && (
              <div className="absolute inset-0 z-10 bg-emerald-600/90 backdrop-blur-[2px] flex flex-col items-center justify-center text-emerald-50 text-center">
                <span
                  className="material-symbols-outlined mb-4"
                  style={{ fontSize: '80px', fontVariationSettings: "'FILL' 1, 'wght' 700" }}
                >
                  check_circle
                </span>
                <h3 className="text-xl font-black tracking-tight mb-2 uppercase italic">
                  Checked In Successful
                </h3>
                <div className="h-px w-12 bg-emerald-50/40 mb-3"></div>
                <p className="text-xs font-bold opacity-90">Enjoy the event!</p>
              </div>
            )}
          </div>

          {/* Attendee Details */}
          <div className="px-6 pb-8 border-t border-border bg-card pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Attendee
                </p>
                <p className="text-sm font-black text-foreground">{ticket.attendeeName}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Email
                </p>
                <p className="text-sm font-bold text-foreground truncate">{ticket.attendeeEmail}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Check-in Slider */}
        {!isCheckedIn && (
          <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500 text-foreground">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center mb-3">
              Arrived at the venue?
            </h4>
            <SwipeToCheckIn
              onComplete={handleSelfCheckIn}
              isLoading={checkInLoading}
              label="Swipe to Self Check-in"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <button className="w-full py-4 px-6 rounded-xl bg-foreground text-background font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-foreground/10">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            Add to Apple Wallet
          </button>
          <button className="w-full py-4 px-6 rounded-xl border-2 border-primary text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-[0.98] transition-all duration-200">
            <span className="material-symbols-outlined">picture_as_pdf</span>
            Download PDF Ticket
          </button>
        </div>

        {/* Support Info */}
        <div className="mt-10 text-center">
          <p className="text-xs text-muted-foreground">
            Need help?{' '}
            <Link to="#" className="text-primary font-bold underline decoration-primary/30">
              Contact Event Support
            </Link>
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-4 leading-relaxed uppercase tracking-widest font-bold">
            Presented by EventCraft OS • Secure Digital Pass
          </p>
        </div>
      </main>

      {/* Celebration overlay */}
      {showCelebration && ticket && (
        <CheckInCelebration ticket={ticket} onDismiss={() => setShowCelebration(false)} />
      )}
    </>
  );
};

export default TicketDetailsPage;
