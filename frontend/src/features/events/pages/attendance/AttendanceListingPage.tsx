import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchEvents } from '@/features/events/store/eventsSlice';
import { Link } from 'react-router-dom';

const AttendanceListingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { events, eventsLoading } = useAppSelector((state) => state.events);

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  // Filter for events owned by the user
  const managedEvents = events.filter((event) => event.isOwner);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <main className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-left">
            <h2 className="text-[2.75rem] font-black tracking-tighter text-foreground leading-none mb-2 underline decoration-primary/20">
              Attendance Management
            </h2>
            <p className="text-muted-foreground max-w-lg text-sm font-medium">
              Select one of your events below to manage guest check-ins, view real-time stats, and
              scan tickets.
            </p>
          </div>

          {eventsLoading && managedEvents.length === 0 ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : managedEvents.length === 0 ? (
            <div className="bg-card rounded-3xl p-12 text-center border-2 border-dashed border-border/30">
              <span className="material-symbols-outlined text-6xl text-primary/20 mb-4">
                calendar_today
              </span>
              <h3 className="text-xl font-bold mb-2 text-card-foreground">No Managed Events</h3>
              <p className="text-muted-foreground mb-6">
                Create your first event to start managing attendance.
              </p>
              <Link
                to="/events/create"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">add</span>
                Create Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managedEvents.map((event) => (
                <div
                  key={event.id}
                  className="group bg-card rounded-3xl overflow-hidden hover:shadow-[0px_20px_50px_rgba(11,28,48,0.12)] transition-all duration-300 border border-border/50 flex flex-col"
                >
                  {/* Banner */}
                  <div className="h-40 relative overflow-hidden bg-muted">
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-primary/10 to-primary/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-primary/30">
                          image
                        </span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                          event.status === 'published'
                            ? 'bg-green-500 text-white'
                            : 'bg-muted-foreground text-white'
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col text-left">
                    <h3 className="text-xl font-black text-card-foreground group-hover:text-primary transition-colors mb-2 line-clamp-1">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold mb-4">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      {new Date(event.startDate || '').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>

                    <div className="mt-auto pt-6 border-t border-border/30 flex items-center justify-between">
                      <div className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">
                        Event Manager
                      </div>
                      <Link
                        to={`/events/${event.id}/attendance`}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-black transition-all hover:brightness-110 active:scale-95 shadow-md shadow-primary/20"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          qr_code_scanner
                        </span>
                        Manage
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AttendanceListingPage;
