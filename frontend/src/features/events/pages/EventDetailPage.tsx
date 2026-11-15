import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchEventDetails } from '@/features/events/store/eventsSlice';
import { toast } from 'sonner';
import TicketSelection from '@/features/tickets/components/TicketSelection';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/authStore';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentEvent: event, eventsLoading } = useAppSelector((state) => state.events);
  const { user } = useAuthStore();
  const { can } = usePermissions();

  const [activeTab, setActiveTab] = useState<'overview' | 'agenda' | 'tickets'>('overview');

  useEffect(() => {
    if (id) {
      dispatch(fetchEventDetails(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (event?.isOwner) {
      navigate(`/events/edit/${event.id}`, { replace: true });
    }
  }, [event, navigate]);

  if (eventsLoading && !event) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">event_busy</span>
          <p className="text-xl font-bold">Event not found</p>
          <Link
            to="/dashboard/events"
            className="mt-4 inline-block text-primary font-bold hover:underline"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isOrganizer = (can('EVENT_UPDATE') && event.isOwner) || isAdmin;
  const startDate = event.startDate ? new Date(event.startDate) : new Date();
  const locationString = event.location
    ? [event.location.address, event.location.city, event.location.country]
        .filter(Boolean)
        .join(', ')
    : 'Online / TBD';

  return (
    <div className="bg-background text-foreground min-h-screen font-display flex flex-col antialiased">
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 md:px-6 py-8">
        {/* Hero Section */}
        <div className="relative rounded-xl overflow-hidden bg-slate-950 h-[300px] mb-6 shadow-xl border border-border">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{
              backgroundImage: `url(${event.bannerImage || 'https://images.unsplash.com/photo-1540575861501-7ad05823c23d?q=80&w=2070&auto=format&fit=crop'})`,
            }}
          ></div>
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>

          <div className="absolute top-4 right-4 flex gap-3">
            <span className="px-3 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1 uppercase tracking-widest shadow-lg">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>{' '}
              {event.status || 'Published'}
            </span>
            {isOrganizer && (
              <div className="flex gap-2">
                <Link
                  to={`/events/${event.id}/studio`}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">videocam</span>
                  Enter Studio
                </Link>
                <Link
                  to={`/events/${event.id}/attendance`}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:brightness-110 rounded-lg text-xs font-bold shadow-lg shadow-primary/30 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                  Check-in / Attendees
                </Link>
                <Link
                  to={`/events/edit/${event.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white hover:bg-white/30 rounded-lg text-xs font-bold border border-white/30 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit Event
                </Link>
              </div>
            )}
          </div>

          <div className="absolute bottom-8 left-8 text-white text-left">
            <div className="flex items-center gap-2 mb-2 text-primary tracking-[0.2em] text-[10px] uppercase font-black">
              {event.type || 'Conference'} •{' '}
              {startDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight drop-shadow-sm">
              {event.title}
            </h1>
            <div
              className="mt-2 text-slate-300 max-w-2xl font-medium opacity-90 text-sm line-clamp-2"
              dangerouslySetInnerHTML={{ __html: event.description || '' }}
            />
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8 border-b border-border">
          <div className="flex flex-nowrap overflow-x-auto gap-8 no-scrollbar">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'agenda', label: 'Agenda' },
              { id: 'tickets', label: 'Tickets' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'agenda' | 'tickets')}
                className={`flex flex-col items-center justify-center border-b-2 pb-3 font-bold text-sm whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'overview' && (
              <>
                {/* Description */}
                <section className="bg-card p-8 rounded-xl border border-border shadow-sm text-left">
                  <h3 className="text-lg font-bold text-card-foreground mb-6 flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      description
                    </span>
                    Event Description
                  </h3>
                  <div
                    className="text-muted-foreground leading-relaxed space-y-4 text-base prose prose-slate dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.description || '' }}
                  />
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Location Card */}
                  <div className="bg-card p-6 rounded-xl border border-border shadow-sm overflow-hidden text-left">
                    <h3 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-3">
                      <span
                        className="material-symbols-outlined text-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        location_on
                      </span>
                      Location
                    </h3>
                    <div className="rounded-lg h-40 bg-muted mb-4 border border-border relative overflow-hidden group">
                      <img
                        className="w-full h-full object-cover grayscale opacity-50 group-hover:opacity-100 transition-opacity duration-500"
                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
                        alt="Map"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-primary p-2.5 rounded-full shadow-xl border-2 border-background animate-bounce">
                          <span className="material-symbols-outlined text-primary-foreground text-base">
                            location_on
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="font-bold text-card-foreground">
                      {event.location?.address || 'TBD'}
                    </p>
                    <p className="text-sm text-muted-foreground" title={locationString}>
                      {event.location?.city || 'Virtual Venue'}
                    </p>
                  </div>

                  {/* Date/Time Card */}
                  <div className="bg-card p-6 rounded-xl border border-border shadow-sm text-left">
                    <h3 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-3">
                      <span
                        className="material-symbols-outlined text-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        calendar_month
                      </span>
                      Date & Time
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
                          <span className="material-symbols-outlined">event</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Starts
                          </p>
                          <p className="font-bold text-card-foreground">
                            {startDate.toLocaleDateString(undefined, { dateStyle: 'long' })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {startDate.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-muted p-2.5 rounded-lg text-muted-foreground">
                          <span className="material-symbols-outlined">event_busy</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Ends
                          </p>
                          <p className="font-bold text-card-foreground">Oct 26, 2024</p>
                          <p className="text-sm text-muted-foreground">06:00 PM PST</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'agenda' && (
              <div className="bg-card p-8 rounded-xl border border-border shadow-sm text-left">
                <h3 className="text-lg font-bold text-card-foreground mb-6">Event Agenda</h3>
                <div className="space-y-4">
                  {[
                    {
                      time: '09:00 AM',
                      title: 'Registration & Refreshments',
                      desc: 'Welcome desk open',
                    },
                    {
                      time: '10:00 AM',
                      title: 'Opening Keynote',
                      desc: 'Future of Decentralized Systems',
                    },
                    {
                      time: '11:30 AM',
                      title: 'Networking Break',
                      desc: 'Coffee and lounge access',
                    },
                    {
                      time: '12:30 PM',
                      title: 'Lunch Session',
                      desc: 'Provided by the organizers',
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-6 p-4 rounded-xl border border-border/50 hover:bg-muted transition-colors"
                    >
                      <span className="text-primary font-bold text-sm w-20 pt-1">{item.time}</span>
                      <div>
                        <p className="font-bold text-card-foreground text-base mb-1">
                          {item.title}
                        </p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="lg:hidden">
                <TicketSelection eventId={event.id} initialTicketTypes={event.ticketTypes || []} />
              </div>
            )}
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6">
            <div className="hidden lg:block">
              <TicketSelection eventId={event.id} initialTicketTypes={event.ticketTypes || []} />
            </div>

            {/* Share Card */}
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm text-left">
              <h3 className="text-sm font-bold text-card-foreground mb-4">Invite Others</h3>
              <div className="flex gap-2 mb-4">
                <input
                  className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground outline-none truncate"
                  readOnly
                  value={`eventcraft.io/events/${event.id}`}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`eventcraft.io/events/${event.id}`);
                    toast.success('Link copied to clipboard!');
                  }}
                  className="bg-primary text-primary-foreground p-2 rounded-lg hover:brightness-110 transition-all flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-base">content_copy</span>
                </button>
              </div>
              <div className="flex justify-between items-center px-2 opacity-60 text-muted-foreground">
                <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">
                  share
                </span>
                <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">
                  send
                </span>
                <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">
                  public
                </span>
                <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">
                  alternate_email
                </span>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 flex items-start gap-4 text-left">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-xl">help</span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Need Help?</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Reach out to our support team for any ticketing or event inquiries.
                </p>
                <button className="mt-3 text-xs font-bold text-primary hover:underline">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventDetailPage;
