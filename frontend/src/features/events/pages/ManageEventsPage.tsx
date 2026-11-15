import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchEvents } from '@/features/events/store/eventsSlice';
import Button from '@/components/ui/button';
import LoadingOverlay from '@/components/ui/loading-overlay';
import { EventType } from '@/features/events/types';

const ManageEventsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { events, eventsLoading } = useAppSelector((state) => state.events);

  useEffect(() => {
    if (events.length === 0 && !eventsLoading) {
      dispatch(fetchEvents());
    }
  }, [dispatch, events.length, eventsLoading]);

  // Filter events where current user is owner
  const myEvents = events.filter((event) => event.isOwner);

  if (eventsLoading && myEvents.length === 0) {
    return <LoadingOverlay isVisible={eventsLoading} message="Fetching your events..." />;
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen">
      <main className="flex-1 px-8 py-12 max-w-7xl mx-auto w-full">
        <header className="mb-12">
          <div className="flex items-center gap-2 text-[0.65rem] font-bold text-primary tracking-[0.15em] uppercase mb-4">
            <span className="w-10 h-[2px] bg-primary"></span>
            ORGANIZER HUB
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground mb-3">
                Manage Events
              </h1>
              <p className="text-muted-foreground max-w-xl font-medium leading-relaxed">
                Oversee your event portfolio. Monitor live streams, manage guest lists, and optimize
                performance from a single command center.
              </p>
            </div>
            <Link to="/events/create">
              <Button className="bg-primary hover:bg-primary-container text-primary-foreground px-8 py-6 rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 transition-all active:scale-[0.98]">
                <span className="material-symbols-outlined text-xl">add</span>
                Create New Event
              </Button>
            </Link>
          </div>
        </header>

        {myEvents.length === 0 ? (
          <div className="bg-card rounded-[32px] border border-border p-20 text-center shadow-sm">
            <div className="size-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-8 border border-border">
              <span className="material-symbols-outlined text-4xl text-muted-foreground">
                event_busy
              </span>
            </div>
            <h3 className="text-xl font-bold text-card-foreground mb-2">No managed events found</h3>
            <p className="text-muted-foreground mb-10 max-w-xs mx-auto text-sm">
              You haven't created any events yet. Start your journey by creating your first
              unforgettable experience.
            </p>
            <Link to="/events/create">
              <Button variant="outline" className="px-8 border-border">
                Get Started
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {myEvents.map((event) => (
              <div
                key={event.id}
                className="group bg-card rounded-3xl border border-border p-6 flex flex-col md:flex-row items-center gap-8 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20"
              >
                {/* Event Visual Meta */}
                <div className="size-24 rounded-2xl bg-muted shrink-0 overflow-hidden border border-border relative">
                  {event.bannerUrl ? (
                    <img src={event.bannerUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-tr from-muted to-muted/80">
                      <span className="material-symbols-outlined text-muted-foreground text-3xl">
                        image
                      </span>
                    </div>
                  )}
                  {/* Status Overlay */}
                  <div className="absolute top-1 right-1">
                    <span
                      className={`size-3 rounded-full border-2 border-background ${
                        event.status === 'published' ? 'bg-emerald-500' : 'bg-muted-foreground'
                      }`}
                    ></span>
                  </div>
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                        event.type === EventType.HYBRID
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
                          : event.type === EventType.VIRTUAL
                            ? 'bg-purple-500/10 border-purple-500/20 text-purple-500'
                            : 'bg-muted border-border text-muted-foreground'
                      }`}
                    >
                      {event.type}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground capitalize">
                      {event.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground truncate mb-1">{event.title}</h3>
                  <p className="text-xs text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    {event.startDate
                      ? new Date(event.startDate).toLocaleDateString(undefined, {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Date TBD'}
                  </p>
                </div>

                {/* Actions Grid */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {(event.type === EventType.HYBRID || event.type === EventType.VIRTUAL) && (
                    <Link to={`/events/${event.id}/studio`}>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl font-bold flex items-center gap-2 h-11 transition-all active:scale-95 shadow-md shadow-indigo-600/20"
                      >
                        <span className="material-symbols-outlined text-sm">videocam</span>
                        Studio
                      </Button>
                    </Link>
                  )}
                  <Link to={`/events/${event.id}/attendance`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-4 rounded-xl border-border h-11 font-bold flex items-center gap-2 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">group</span>
                      Attendance
                    </Button>
                  </Link>
                  <Link to={`/events/edit/${event.id}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-11 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all active:scale-95"
                      title="Edit Event"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </Button>
                  </Link>
                  <Link to={`/events/${event.id}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-11 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all active:scale-95"
                      title="View Public Page"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageEventsPage;
