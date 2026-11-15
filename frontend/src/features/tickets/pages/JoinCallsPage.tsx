import React from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_MY_TICKETS_V2 } from '../graphql/operations';
import { MyTicketV2 } from '../types';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/button';

const JoinCallsPage: React.FC = () => {
  const { data, loading } = useQuery<{ myTickets: MyTicketV2[] }>(GET_MY_TICKETS_V2);

  const tickets = data?.myTickets || [];

  // Filter for virtual or hybrid events
  const callTickets = tickets.filter(
    (ticket) => ticket.event.type === 'virtual' || ticket.event.type === 'hybrid',
  );

  // Deduplicate events by event.id to show each event only once
  const uniqueCallTickets = callTickets.reduce((acc, ticket) => {
    if (!acc.some((t) => t.event.id === ticket.event.id)) {
      acc.push(ticket);
    }
    return acc;
  }, [] as MyTicketV2[]);

  if (loading && uniqueCallTickets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background min-h-screen">
      <main className="max-w-5xl mx-auto px-8 py-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[0.65rem] font-bold text-primary tracking-[0.2em] uppercase mb-4">
              <span className="w-8 h-[2px] bg-primary"></span>
              Virtual Experience
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground mb-3">
              Join Event Calls
            </h1>
            <p className="text-muted-foreground max-w-lg font-medium leading-relaxed">
              Access your digital front-row seats. Join global broadcasts and interactive virtual
              sessions for your registered events.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="px-6 py-4 bg-card rounded-3xl border border-border shadow-sm flex items-center gap-4">
              <div className="size-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none">
                  Status
                </p>
                <p className="text-sm font-bold text-foreground">Servers Operational</p>
              </div>
            </div>
          </div>
        </header>

        {uniqueCallTickets.length === 0 ? (
          <div className="bg-card rounded-[40px] border border-border p-24 text-center shadow-sm">
            <div className="size-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-8 border border-border">
              <span className="material-symbols-outlined text-4xl text-muted-foreground/30">
                video_call
              </span>
            </div>
            <h3 className="text-2xl font-black text-foreground mb-3">No active virtual sessions</h3>
            <p className="text-muted-foreground mb-10 max-w-sm mx-auto font-medium">
              You don't have any tickets for upcoming virtual or hybrid events. Explore our calendar
              to find your next digital experience.
            </p>
            <Link to="/dashboard/events">
              <Button className="bg-primary text-primary-foreground px-10 py-6 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-100 transition-all">
                Explore Events
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {uniqueCallTickets.map((ticket) => (
              <div
                key={ticket.issuanceId}
                className="group bg-card rounded-[32px] border border-border p-8 transition-all hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="size-16 rounded-2xl bg-muted flex items-center justify-center border border-border group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-muted-foreground/40 group-hover:text-primary text-3xl">
                      broadcast_on_personal
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                      ticket.event.type === 'hybrid'
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'bg-purple-500/10 border-purple-500/20 text-purple-500'
                    }`}
                  >
                    {ticket.event.type} Session
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-black tracking-tight text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
                    {ticket.event.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground font-bold text-[11px] uppercase tracking-widest mb-8">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      {new Date(ticket.event.startDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="size-1 bg-border rounded-full"></div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      1080p Crystal HD
                    </div>
                  </div>
                </div>

                <Link
                  to={`/events/${ticket.event.id}/live/${ticket.issuanceId}`}
                  className="mt-auto"
                >
                  <Button className="w-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl group-hover:shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    Join Live Stream
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                      arrow_forward_ios
                    </span>
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default JoinCallsPage;
