import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { GET_ORDER } from '../graphql/operations';
import { OrderWithTickets, OrderStatus } from '../types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchEvents } from '@/features/events/store/eventsSlice';

const SuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { events } = useAppSelector((state) => state.events);
  const { data, loading, error } = useQuery<{ getOrder: OrderWithTickets }>(GET_ORDER, {
    variables: { orderId },
  });

  const order = data?.getOrder;

  useEffect(() => {
    if (events.length === 0) {
      dispatch(fetchEvents());
    }
  }, [dispatch, events.length]);

  if (loading && !data)
    return (
      <div className="flex h-screen items-center justify-center">Loading order details...</div>
    );
  if (error)
    return (
      <div className="flex h-screen items-center justify-center text-error">
        Error loading order
      </div>
    );

  const event = events.find((e) => e.id === order?.eventId);

  return (
    <div className="bg-background text-foreground font-body antialiased min-h-screen pt-24 pb-12 px-6 flex flex-col items-center">
      {/* Success Hero Section */}
      <div className="w-full max-w-2xl text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 text-primary">
          <span
            className="material-symbols-outlined text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
          You're going to {event?.title || 'the event'}!
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          {order?.status === OrderStatus.pending
            ? 'Your payment is being processed. Once confirmed, your tickets will appear here and in your email.'
            : `Your booking is ${order?.status}. We've sent a copy of your tickets to your email.`}
        </p>
      </div>

      {/* Ticket Card */}
      <div className="w-full max-w-xl bg-card rounded-3xl overflow-hidden shadow-2xl shadow-primary/5 flex flex-col items-center border border-border">
        <div className="w-full h-48 relative overflow-hidden">
          <img
            src={
              event?.bannerImage ||
              'https://images.unsplash.com/photo-1540575861501-7ad05823c23d?q=80&w=2070&auto=format&fit=crop'
            }
            alt={event?.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-card to-transparent"></div>
          <div className="absolute bottom-4 left-6">
            <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              Confirmed
            </span>
          </div>
        </div>

        <div className="w-full p-8 bg-card flex flex-col items-center -mt-4 relative rounded-t-3xl">
          {/* QR Code Block */}
          <div className="bg-white p-6 rounded-2xl border border-border mb-8 flex flex-col items-center shadow-lg">
            <div className="w-48 h-48 relative border-4 border-muted rounded-xl flex items-center justify-center p-2">
              <span className="material-symbols-outlined text-primary text-6xl">qr_code_2</span>
            </div>
            <span className="mt-4 text-[11px] font-mono tracking-[0.2em] text-slate-500 uppercase">
              EC-{order?.id?.substring(0, 8).toUpperCase() || 'ORDER'}
            </span>
          </div>

          <div className="w-full grid grid-cols-2 gap-y-8 gap-x-4 mb-8 text-left">
            <div className="col-span-2 pb-4 border-b border-border">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
                Attendee
              </p>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                  {order?.tickets[0]?.attendeeName?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="text-sm font-black text-foreground leading-tight">
                    {order?.tickets?.[0]?.attendeeName || 'Attendee'}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {order?.tickets?.[0]?.attendeeEmail || 'Email'}
                  </p>
                  {order?.tickets?.[0]?.jobTitle && (
                    <p className="text-[10px] text-primary/70 font-bold uppercase tracking-widest mt-0.5">
                      {order.tickets[0].jobTitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                Date
              </p>
              <p className="text-sm font-bold text-foreground">
                {event?.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                Time
              </p>
              <p className="text-sm font-bold text-foreground">
                {event?.startDate
                  ? new Date(event.startDate).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'TBD'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                Location
              </p>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                <p className="text-sm font-bold text-foreground">
                  {typeof event?.location === 'string'
                    ? event.location
                    : event?.location?.city || 'TBD'}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => navigate('/tickets/my')}
              className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98] shadow-xl shadow-primary/20"
            >
              <span className="material-symbols-outlined text-xl">confirmation_number</span>
              See My Tickets
            </button>
            <button className="w-full h-14 bg-muted text-foreground font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-muted/80 transition-all active:scale-[0.98]">
              <span className="material-symbols-outlined text-xl">file_download</span>
              Download PDF Receipt
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={() => navigate('/dashboard/events')}
          className="text-primary font-bold text-sm hover:underline underline-offset-4 flex items-center justify-center gap-2"
        >
          Return to Explore
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
