import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchEvents } from '@/features/events/store/eventsSlice';
import { GlobalSearchBar } from '@/features/events/components/GlobalSearchBar';
import { Skeleton } from '@/components/ui/skeleton';

const IndexPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const dispatch = useAppDispatch();
  const { events, eventsLoading } = useAppSelector((state) => state.events);
  const [searchParams] = useSearchParams();
  const didScrollRef = useRef(false);

  const [selectedTag, setSelectedTag] = useState('All Events');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const [searchLocation, setSearchLocation] = useState(() => searchParams.get('loc') ?? '');
  const [searchDate, setSearchDate] = useState('');
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (events.length === 0 && !eventsLoading) {
      dispatch(fetchEvents());
    }
  }, [dispatch, events.length, eventsLoading]);

  // Sync URL search params → local state and auto-scroll when navigated from another page
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    const loc = searchParams.get('loc') ?? '';
    /* eslint-disable react-hooks/set-state-in-effect */
    setSearchQuery(q);
    setSearchLocation(loc);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Only auto-scroll once per navigation (not on initial mount without params)
    if ((q || loc) && !didScrollRef.current) {
      didScrollRef.current = true;
      const tryScroll = () => {
        const el = document.getElementById('trending-experiences');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          // Retry until the section is rendered
          requestAnimationFrame(tryScroll);
        }
      };
      // Small delay to let the page render first
      setTimeout(tryScroll, 150);
    }

    // Reset the scroll guard when params are cleared
    if (!q && !loc) {
      didScrollRef.current = false;
    }
  }, [searchParams]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // 1. Tag filtering (Live)
      const matchesTag =
        selectedTag === 'All Events' ||
        event.tags?.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase()));

      // 2. Query filtering
      const matchesQuery =
        !searchQuery ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      // 3. Location filtering
      const city = event.location?.city || '';
      const country = event.location?.country || '';
      // Format exactly like the autocomplete: "City, Country" or "City"
      const eventLocationStr = country ? `${city}, ${country}`.toLowerCase() : city.toLowerCase();
      const searchLocNormalized = searchLocation.trim().toLowerCase();
      const matchesLocation = !searchLocation || eventLocationStr.includes(searchLocNormalized);

      // 4. Date filtering
      const matchesDate =
        !searchDate || (event.startDate && event.startDate.startsWith(searchDate));

      return matchesTag && matchesQuery && matchesLocation && matchesDate;
    });
  }, [events, selectedTag, searchQuery, searchLocation, searchDate]);


  // Show up to 10 filtered events on the landing page
  const featuredEvents = filteredEvents.slice(0, 10);

  return (
    <div className="bg-background font-display text-foreground selection:bg-primary/30 min-h-screen">
      <main>
        {/* Hero Section */}
        <section className="relative pt-16 pb-24 px-8 bg-background z-30">
          <div className="max-w-7xl mx-auto text-center relative z-50">
            <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-muted text-primary font-bold text-[0.7rem] uppercase tracking-widest">
              The Digital Curator
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.9] text-foreground">
              Craft Unforgettable <br />{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-indigo-400">
                Experiences
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-lg md:text-xl font-medium leading-relaxed mb-12">
              The most precise platform for event planning, personalization, and automation.
              Designed for those who curate with intent.
            </p>

            {/* Search Bar */}
            <GlobalSearchBar
              key={resetKey}
              onSearch={(q, loc, dateStr) => {
                setSearchQuery(q);
                setSearchLocation(loc);
                setSearchDate(dateStr || '');

                // Scroll to trending experiences to show results
                const element = document.getElementById('trending-experiences');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />

            <div className="flex items-center justify-center gap-4">
              <Link
                to={isAuthenticated ? '/dashboard' : '/organizer'}
                className="bg-primary/10 text-primary px-8 py-4 rounded-xl font-bold hover:bg-primary/20 transition-all flex items-center gap-2"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}{' '}
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px]"></div>
        </section>

        {/* Featured Banner Section */}
        <section className="px-8 mb-4">
          <div className="max-w-7xl mx-auto relative rounded-[2rem] overflow-hidden group">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop" 
                alt="Featured Event" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 py-20 px-12 md:py-32 md:px-20 max-w-2xl">
              <span className="inline-block px-3 py-1 bg-pink-500 text-white text-[0.65rem] font-black uppercase tracking-widest mb-6 rounded-sm">
                Get Into It
              </span>
              <h2 className="text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tighter mb-10">
                FROM POP BALLADS <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-blue-400">
                  TO EMO ENCORES
                </span>
              </h2>
              <button className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-white/90 transition-all active:scale-95 shadow-xl">
                Get Into Live Music
              </button>
            </div>

            {/* Floating Decorative Element */}
            <div className="absolute bottom-0 right-0 w-1/3 h-full pointer-events-none hidden lg:block">
              {/* This space could hold an artist cutout if we had a transparent PNG */}
            </div>
          </div>
        </section>

        {/* Category Icons */}
        <section className="py-16 bg-background border-b border-border overflow-hidden">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-start justify-between md:justify-center gap-8 md:gap-16 overflow-x-auto no-scrollbar pb-4 text-center">
              {[
                { name: 'All Events', icon: 'apps' },
                { name: 'Music', icon: 'mic_external_on' },
                { name: 'Nightlife', icon: 'nightlife' },
                { name: 'Arts', icon: 'theater_comedy' },
                { name: 'Business', icon: 'monitoring' },
                { name: 'Food', icon: 'local_pizza' },
                { name: 'Wellness', icon: 'spa' },
                { name: 'Workshops', icon: 'groups' },
              ].map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedTag(category.name)}
                  className="flex flex-col items-center gap-4 transition-all duration-300 group min-w-[80px]"
                >
                  <div 
                    className={`w-20 h-20 rounded-full flex items-center justify-center border transition-all duration-500 shadow-sm ${
                      selectedTag === category.name
                        ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10 ring-4 ring-primary/5'
                        : 'bg-card border-border group-hover:border-primary/50 group-hover:scale-105'
                    }`}
                  >
                    <span 
                      className={`material-symbols-outlined text-3xl transition-transform duration-500 ${
                        selectedTag === category.name 
                          ? 'text-primary scale-110' 
                          : 'text-muted-foreground group-hover:text-primary'
                      }`}
                    >
                      {category.icon}
                    </span>
                  </div>
                  <span 
                    className={`text-xs font-bold tracking-tight transition-colors duration-300 ${
                      selectedTag === category.name ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Events Grid */}
        <section id="trending-experiences" className="py-24 px-8 max-w-7xl mx-auto scroll-mt-24">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">
                Discover Now
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                Trending Experiences
              </h2>
            </div>
            <Link
              to={isAuthenticated ? '/dashboard/events' : '/events'}
              className="hidden md:flex items-center gap-2 text-primary font-bold hover:underline underline-offset-4"
            >
              View all events <span className="material-symbols-outlined">north_east</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {eventsLoading ? (
              [1, 2, 3, 4, 5, 6].map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className={`group ${index % 3 === 1 ? 'md:translate-y-8' : ''}`}
                >
                  <div className="relative aspect-4/5 rounded-2xl overflow-hidden mb-6 shadow-sm border border-border bg-muted/20">
                    <Skeleton className="absolute inset-0 w-full h-full" />
                    
                    {/* Centered Secondary Loader */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative size-10">
                        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                        <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary border-t-transparent shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]" />
                      </div>
                    </div>

                    <div className="absolute top-4 left-4">
                      <Skeleton className="h-6 w-16 rounded-lg opacity-40" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-none flex flex-col items-center bg-muted rounded-xl p-3 h-fit w-14 h-16">
                      <Skeleton className="h-3 w-8 mb-2 opacity-50" />
                      <Skeleton className="h-6 w-6 opacity-50" />
                    </div>
                    <div className="flex-1">
                      <Skeleton className="h-6 w-full mb-3 rounded" />
                      <Skeleton className="h-4 w-2/3 rounded" />
                    </div>
                  </div>
                </div>
              ))
            ) : events.length > 0 && filteredEvents.length === 0 ? (
              <div className="col-span-1 md:col-span-3 py-20 text-center bg-muted/30 rounded-3xl border border-dashed border-border">
                <span className="material-symbols-outlined text-muted-foreground text-6xl mb-4">
                  search_off
                </span>
                <p className="text-muted-foreground font-medium text-lg mb-6">
                  No events found matching your criteria.
                </p>
                <button
                  onClick={() => {
                    setSelectedTag('All Events');
                    setSearchQuery('');
                    setSearchLocation('');
                    setSearchDate('');
                    setResetKey((prev) => prev + 1);
                  }}
                  className="bg-card border border-border text-primary px-6 py-2.5 rounded-xl font-bold hover:border-primary transition-all active:scale-95 shadow-sm"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              featuredEvents.map((event, index) => {
                const eventDate = new Date(event.startDate || '1970-01-01');
                const month = event.startDate
                  ? eventDate.toLocaleString('default', { month: 'short' }).toUpperCase()
                  : 'TBD';
                const day = event.startDate
                  ? eventDate.getDate().toString().padStart(2, '0')
                  : '--';

                return (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group cursor-pointer ${index % 3 === 1 ? 'md:translate-y-8' : ''}`}
                  >
                    <div className="relative aspect-4/5 rounded-2xl overflow-hidden mb-6 shadow-sm border border-border">
                      <img
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={event.title}
                        src={
                          event.bannerUrl ||
                          'https://images.unsplash.com/photo-1540575861501-7ad060e39fe1?q=80&w=2070&auto=format&fit=crop'
                        }
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-card/90 backdrop-blur-md text-foreground text-[0.65rem] font-black uppercase px-3 py-1.5 rounded-lg tracking-widest">
                          {event.tags?.[0] || 'Event'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-none flex flex-col items-center bg-muted rounded-xl p-3 h-fit">
                        <span className="text-[0.6rem] font-black uppercase tracking-widest text-primary">
                          {month}
                        </span>
                        <span className="text-xl font-black text-foreground leading-none">
                          {day}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium mb-1">
                          <span className="material-symbols-outlined text-[1rem]">location_on</span>
                          {event.location?.city || 'Virtual'}
                          {event.location?.country ? `, ${event.location.country}` : ''}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* How It Works (Organizer) */}
        <section className="py-24 bg-muted/20 border-t border-border">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-20">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">
                Organizer Tools
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-6">
                Scale with Precision
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto font-medium">
                Tools designed for the professional curator. Move from idea to execution in minutes,
                not months.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center p-8 bg-card border border-border rounded-3xl transition-transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    add_circle
                  </span>
                </div>
                <h4 className="text-xl font-black text-card-foreground mb-4">Create</h4>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                  Design beautiful registration pages and white-labeled ticket designs with our
                  editorial builder.
                </p>
              </div>
              <div className="text-center p-8 bg-card border border-border rounded-3xl transition-transform hover:-translate-y-2 shadow-[0_20px_40px_rgba(30,25,40,0.04)]">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <span className="material-symbols-outlined text-primary text-3xl">analytics</span>
                </div>
                <h4 className="text-xl font-black text-card-foreground mb-4">Manage</h4>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                  Real-time attendee tracking, check-in apps, and automated marketing workflows in
                  one dash.
                </p>
              </div>
              <div className="text-center p-8 bg-card border border-border rounded-3xl transition-transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    trending_up
                  </span>
                </div>
                <h4 className="text-xl font-black text-card-foreground mb-4">Grow</h4>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                  Leverage deep analytics and attendee insights to scale your community and revenue
                  per seat.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-20 px-8 bg-background">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-12">
              Join 10,000+ organizers worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-10 opacity-30 grayscale invert dark:invert-0">
              <div className="text-2xl font-black tracking-tighter">TECHFLOW</div>
              <div className="text-2xl font-black tracking-tighter">LUMINA</div>
              <div className="text-2xl font-black tracking-tighter">CREATIVE CO</div>
              <div className="text-2xl font-black tracking-tighter">GLOBAL SYMPOSIUM</div>
              <div className="text-2xl font-black tracking-tighter">NEXUS</div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 px-8 mb-24 bg-background">
          <div className="max-w-6xl mx-auto bg-card rounded-4xl p-12 md:p-20 text-center relative overflow-hidden border border-border shadow-2xl">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-card-foreground mb-8">
                Ready to host your <br /> next event?
              </h2>
              <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto font-medium">
                Create your first event for free. No credit card required. Experience the power of
                automation.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to={isAuthenticated ? '/dashboard/events/manage' : '/organizer'}
                  className="bg-primary text-primary-foreground px-10 py-5 rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                  {isAuthenticated ? 'Manage Events' : 'Create your event'}
                </Link>
                <button className="bg-muted text-foreground px-10 py-5 rounded-2xl font-bold text-lg hover:bg-muted/80 transition-colors">
                  Talk to Sales
                </button>
              </div>
            </div>
            {/* Abstract BG for CTA */}
            <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20">
              <div className="absolute top-[-50%] right-[-10%] w-[80%] h-[150%] bg-primary rotate-12 blur-[120px]"></div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 w-full pt-20 pb-10 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 px-12 max-w-7xl mx-auto">
          <div className="col-span-2 md:col-span-1">
            <div className="text-lg font-black text-foreground mb-6">EventCraft</div>
            <p className="text-muted-foreground text-xs font-medium leading-relaxed max-w-[200px]">
              Empowering the world's most creative curators with professional planning tools.
            </p>
          </div>
          <div>
            <h5 className="text-xs uppercase tracking-widest font-semibold text-primary mb-6">
              Platform
            </h5>
            <ul className="flex flex-col gap-4">
              <li>
                <Link
                  className="text-muted-foreground hover:text-primary transition-colors text-xs font-semibold"
                  to="#"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted-foreground hover:text-primary transition-colors text-xs font-semibold"
                  to="#"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted-foreground hover:text-primary transition-colors text-xs font-semibold"
                  to="#"
                >
                  Solutions
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs uppercase tracking-widest font-semibold text-primary mb-6">
              Company
            </h5>
            <ul className="flex flex-col gap-4">
              <li>
                <Link
                  className="text-muted-foreground hover:text-primary transition-colors text-xs font-semibold"
                  to="#"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted-foreground hover:text-primary transition-colors text-xs font-semibold"
                  to="#"
                >
                  Career
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted-foreground hover:text-primary transition-colors text-xs font-semibold"
                  to="#"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs uppercase tracking-widest font-semibold text-primary mb-6">
              Legal
            </h5>
            <ul className="flex flex-col gap-4">
              <li>
                <Link
                  className="text-muted-foreground hover:text-primary transition-colors text-xs font-semibold"
                  to="#"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted-foreground hover:text-primary transition-colors text-xs font-semibold"
                  to="#"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted-foreground hover:text-primary transition-colors text-xs font-semibold"
                  to="#"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-12 mt-20 pt-8 border-t border-border">
          <div className="text-xs uppercase tracking-widest font-semibold text-muted-foreground/50">
            © {new Date().getFullYear()} EventCraft. The Digital Curator.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndexPage;
