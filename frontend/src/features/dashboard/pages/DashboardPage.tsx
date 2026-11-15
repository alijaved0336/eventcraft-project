import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchEvents } from '@/features/events/store/eventsSlice';
import { useAuthStore } from '@/store/authStore';

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { events, eventsLoading } = useAppSelector((state) => state.events);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (events.length === 0 && !eventsLoading) {
      dispatch(fetchEvents());
    }
  }, [dispatch, events.length, eventsLoading]);

  // Derived stats from real data
  const totalEvents = events.length;
  const publishedEvents = events.filter(
    (e) => e.status.toLowerCase() === 'published' || e.status.toLowerCase() === 'live',
  ).length;
  const recentEvents = [...events].slice(0, 3);

  if (eventsLoading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary font-black">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Sub-header (Breadcrumbs & Search) */}
      <div className="h-16 flex items-center justify-between px-8 shrink-0 border-b border-border">
        <div className="flex items-center gap-4">
          <nav aria-label="Breadcrumb" className="flex text-sm text-muted-foreground">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
                <span className="text-foreground font-medium">Dashboard</span>
              </li>
            </ol>
          </nav>
        </div>
        <div className="flex items-center gap-6 text-muted-foreground">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
              search
            </span>
            <input
              className="w-full bg-muted border-none rounded-lg py-1.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground outline-none transition-all text-foreground"
              placeholder="Search analytics..."
              type="text"
            />
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <main className="flex-1 overflow-y-auto p-8 flex flex-col xl:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-8">
          {/* Header / Welcome */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2 text-foreground">
                Hello,{' '}
                {(user?.fullName?.includes('@')
                  ? (user.fullName.split('@')[0] || '').charAt(0).toUpperCase() +
                    (user.fullName.split('@')[0] || '').slice(1)
                  : user?.fullName?.split(' ')[0]) || 'Organizer'}
                !
              </h2>
              <p className="text-muted-foreground font-medium">
                Here's what's happening with your events today.
              </p>
            </div>
            <div className="flex bg-card rounded-xl p-1 shadow-sm border border-border">
              <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                Last 30 Days
              </button>
              <button className="px-4 py-1.5 text-xs font-bold rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                Yearly
              </button>
            </div>
          </div>

          {/* Stats Summary Widget */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Events', val: totalEvents, trend: '+12%', color: 'bg-primary' },
              {
                label: 'Published',
                val: publishedEvents,
                trend: '+5%',
                color: 'bg-emerald-500',
              },
              { label: 'Total Orders', val: 0, trend: '0%', color: 'bg-indigo-500' },
              { label: 'Total Revenue', val: '$0.00', trend: '0%', color: 'bg-amber-500' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-card p-6 rounded-2xl shadow-sm border border-border group hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {stat.label}
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                    {stat.trend}
                  </span>
                </div>
                <div className="flex items-end gap-2 px-1">
                  <span className="text-2xl font-black text-card-foreground">{stat.val}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Graph Placeholder */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-card-foreground">Event Performance</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Registration trends across time
                </p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-[10px] font-bold text-foreground">
                  <div className="size-2 rounded-full bg-primary"></div>
                  Page Views
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-[10px] font-bold text-foreground">
                  <div className="size-2 rounded-full bg-emerald-500"></div>
                  Sales
                </div>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-3 px-4">
              {[40, 70, 45, 90, 65, 80, 55, 75, 85, 60, 95, 50].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3">
                  <div
                    className="w-full bg-linear-to-t from-primary/10 to-primary rounded-t-lg transition-all duration-700 hover:brightness-110"
                    style={{ height: `${h}%` }}
                  ></div>
                  <span className="text-[10px] text-muted-foreground font-bold">
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Events Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Recent Events</h3>
              <Link
                to="/dashboard/events"
                className="text-primary text-xs font-bold hover:underline flex items-center gap-1 transition-all"
              >
                View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentEvents.length > 0 ? (
                recentEvents.map((event) => (
                  <Link
                    to={event.isOwner || isAdmin ? `/events/edit/${event.id}` : `/events/${event.id}`}
                    key={event.id}
                    className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl hover:shadow-primary/5 transition-all"
                  >
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${event.bannerUrl || 'https://images.unsplash.com/photo-1540575861501-7ad05823c23d?q=80&w=2070&auto=format&fit=crop'})`,
                        }}
                      ></div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold truncate group-hover:text-primary transition-colors text-card-foreground">
                        {event.title}
                      </h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-bold text-muted-foreground italic">
                          {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-tighter">
                          {event.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-3 py-10 text-center border-2 border-dashed border-border rounded-2xl">
                  <p className="text-muted-foreground font-medium">No events found yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="w-full xl:w-80 flex flex-col gap-8">
          {/* Quick Actions Card */}
          <div className="bg-primary rounded-3xl p-6 text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 translate-x-1/2 -translate-y-1/2 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-lg font-black mb-4 relative z-10">Quick Actions</h3>
            <div className="flex flex-col gap-3 relative z-10">
              <Link
                to="/events/create"
                className="w-full py-3 bg-background text-primary rounded-xl font-black text-sm text-center hover:bg-muted transition-colors shadow-lg"
              >
                Create New Event
              </Link>
              <button className="w-full py-3 bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 rounded-xl font-bold text-sm text-center hover:bg-primary-foreground/20 transition-colors">
                Import CSV
              </button>
            </div>
          </div>

          {/* Upcoming Agenda Placeholder */}
          <div className="bg-card rounded-3xl p-6 border border-border shadow-sm flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-card-foreground">Upcoming</h3>
              <span className="material-symbols-outlined text-muted-foreground">more_horiz</span>
            </div>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className="size-12 rounded-2xl bg-muted border border-border flex flex-col items-center justify-center group-hover:border-primary transition-colors">
                    <span className="text-xs font-black leading-none text-foreground">
                      {10 + i}
                    </span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">
                      Oct
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate group-hover:text-primary transition-colors text-card-foreground">
                      Staff Briefing Meeting
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      10:00 AM • Conference Room A
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 bg-muted text-muted-foreground rounded-xl font-bold text-xs hover:bg-muted/80 hover:text-foreground transition-colors">
              View All Schedule
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default DashboardPage;
