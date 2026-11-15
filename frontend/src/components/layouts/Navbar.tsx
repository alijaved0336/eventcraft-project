import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import SettingsDrawer from '@/features/settings/components/SettingsDrawer';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchEvents } from '@/features/events/store/eventsSlice';
import type { Event } from '@/features/events/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-primary rounded-sm not-italic">
        {text.slice(idx, idx + query.trim().length)}
      </mark>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

// ─── Event Suggestions Panel ──────────────────────────────────────────────────

interface EventSuggestionsProps {
  results: Event[];
  loading: boolean;
  searchWhat: string;
  searchWhere: string;
  onSelect: (event: Event) => void;
  onViewAll: () => void;
}

const EventSuggestions: React.FC<EventSuggestionsProps> = ({
  results,
  loading,
  searchWhat,
  searchWhere,
  onSelect,
  onViewAll,
}) => {
  if (loading) {
    return (
      <div className="p-3 space-y-1.5">
        <p className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground px-2 pt-1 pb-0.5">
          Loading events…
        </p>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <span className="material-symbols-outlined text-muted-foreground text-4xl">search_off</span>
        <p className="text-sm font-semibold text-muted-foreground">
          {searchWhat || searchWhere
            ? `No events matching your search`
            : 'No events available'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 pt-3 pb-1">
        <p className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">
          {searchWhat || searchWhere ? `${results.length} result${results.length !== 1 ? 's' : ''}` : 'All Events'}
        </p>
      </div>
      <ul className="max-h-[340px] overflow-y-auto overscroll-contain p-2 space-y-0.5">
        {results.slice(0, 8).map((event) => {
          const eventDate = event.startDate ? new Date(event.startDate) : null;
          const month = eventDate
            ? eventDate.toLocaleString('default', { month: 'short' }).toUpperCase()
            : 'TBD';
          const day = eventDate ? eventDate.getDate().toString().padStart(2, '0') : '--';
          const locationStr = [event.location?.city, event.location?.country]
            .filter(Boolean)
            .join(', ');

          return (
            <li key={event.id}>
              <button
                onMouseDown={(e) => { e.preventDefault(); onSelect(event); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left group"
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-border bg-muted">
                  {event.bannerUrl ? (
                    <img
                      src={event.bannerUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-muted-foreground text-lg">event</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-card-foreground truncate group-hover:text-primary transition-colors">
                    {highlight(event.title, searchWhat)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {locationStr && (
                      <span className="text-xs text-muted-foreground font-medium truncate">
                        <span className="material-symbols-outlined text-[0.7rem] align-middle mr-0.5">location_on</span>
                        {highlight(locationStr, searchWhere)}
                      </span>
                    )}
                    {event.tags?.[0] && (
                      <span className="text-[0.6rem] font-black uppercase tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary rounded-md shrink-0">
                        {event.tags[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date badge */}
                <div className="shrink-0 flex flex-col items-center bg-muted rounded-lg px-2 py-1 min-w-[36px]">
                  <span className="text-[0.55rem] font-black uppercase tracking-widest text-primary leading-none">{month}</span>
                  <span className="text-sm font-black text-foreground leading-none">{day}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {results.length > 8 && (
        <div className="border-t border-border px-4 py-3">
          <button
            onMouseDown={(e) => { e.preventDefault(); onViewAll(); }}
            className="w-full text-center text-sm font-bold text-primary hover:underline underline-offset-4 transition-colors"
          >
            View all {results.length} results
            <span className="material-symbols-outlined text-sm align-middle ml-1">north_east</span>
          </button>
        </div>
      )}
    </>
  );
};

// ─── Location Suggestions Panel ───────────────────────────────────────────────

interface LocationSuggestionsProps {
  locations: string[];
  searchWhere: string;
  onSelect: (loc: string) => void;
}

const LocationSuggestions: React.FC<LocationSuggestionsProps> = ({
  locations,
  searchWhere,
  onSelect,
}) => {
  const filtered = useMemo(() => {
    if (!searchWhere.trim()) return locations;
    return locations.filter((l) => l.toLowerCase().includes(searchWhere.trim().toLowerCase()));
  }, [locations, searchWhere]);

  return (
    <>
      <div className="px-4 pt-3 pb-1">
        <p className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">
          {searchWhere.trim() ? 'Matching Locations' : 'All Locations'}
        </p>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="material-symbols-outlined text-muted-foreground text-3xl">location_off</span>
          <p className="text-sm font-semibold text-muted-foreground">No matching locations</p>
        </div>
      ) : (
        <ul className="max-h-[300px] overflow-y-auto overscroll-contain p-2 space-y-0.5">
          {filtered.map((loc) => (
            <li key={loc}>
              <button
                onMouseDown={(e) => { e.preventDefault(); onSelect(loc); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[1rem]">location_on</span>
                </div>
                <span className="text-sm font-bold text-card-foreground group-hover:text-primary transition-colors truncate">
                  {highlight(loc, searchWhere)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

// ─── Main Navbar ───────────────────────────────────────────────────────────────

type ActiveField = 'what' | 'where' | null;

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Search state
  const [searchWhat, setSearchWhat] = useState('');
  const [searchWhere, setSearchWhere] = useState('');
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Redux
  const dispatch = useAppDispatch();
  const { events, eventsLoading } = useAppSelector((state) => state.events);

  // Fetch events on mount if not already loaded
  useEffect(() => {
    if (events.length === 0 && !eventsLoading) {
      dispatch(fetchEvents());
    }
  }, [dispatch, events.length, eventsLoading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Derive unique locations from all events
  const allLocations = useMemo<string[]>(() => {
    const seen = new Set<string>();
    const locs: string[] = [];
    events.forEach((event) => {
      const city = event.location?.city?.trim();
      const country = event.location?.country?.trim();
      if (!city && !country) return;
      const label = city && country ? `${city}, ${country}` : city || country || '';
      if (label && !seen.has(label)) {
        seen.add(label);
        locs.push(label);
      }
    });
    return locs.sort();
  }, [events]);

  // Reactive filtered event results (filters by both fields simultaneously)
  const filteredSuggestions = useMemo<Event[]>(() => {
    return events.filter((event) => {
      const matchesWhat =
        !searchWhat.trim() ||
        event.title.toLowerCase().includes(searchWhat.trim().toLowerCase()) ||
        event.tags?.some((t) => t.toLowerCase().includes(searchWhat.trim().toLowerCase()));

      const city = event.location?.city || '';
      const country = event.location?.country || '';
      const locationStr = [city, country].filter(Boolean).join(', ').toLowerCase();
      const matchesWhere =
        !searchWhere.trim() || locationStr.includes(searchWhere.trim().toLowerCase());

      return matchesWhat && matchesWhere;
    });
  }, [events, searchWhat, searchWhere]);

  // Auth pages return null early
  const isAuthPage = location.pathname.startsWith('/auth');
  if (isAuthPage) return null;

  const isHomePage = location.pathname === '/';
  const isEventsPage = location.pathname === '/events';
  const showSearchBar = isHomePage || isEventsPage;

  const hasActiveSearch = searchWhat.trim() !== '' || searchWhere.trim() !== '';

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/auth/login');
  };

  /** Commit search: update URL params → IndexPage reacts and filters */
  const executeSearch = (what = searchWhat, where = searchWhere) => {
    setActiveField(null);
    const params = new URLSearchParams();
    if (what.trim()) params.set('q', what.trim());
    if (where.trim()) params.set('loc', where.trim());
    const queryString = params.toString();

    if (isHomePage) {
      navigate(`/?${queryString}`, { replace: true });
      setTimeout(() => {
        document.getElementById('trending-experiences')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      navigate(`/?${queryString}`);
    }
  };

  /** Clicking an event suggestion: set its title as the what-query, scroll home to show only that event */
  const handleSelectEvent = (event: Event) => {
    setActiveField(null);
    setSearchWhat(event.title);
    // Also clear location to let the title uniquely identify the result
    executeSearch(event.title, searchWhere);
  };

  /** Clicking a location suggestion: fill the where field and re-run the search */
  const handleSelectLocation = (loc: string) => {
    setSearchWhere(loc);
    // Keep active so the user can see the pill updated, then close
    setActiveField(null);
    executeSearch(searchWhat, loc);
  };

  /** Clear all search fields and reset the home page listing */
  const handleClear = () => {
    setSearchWhat('');
    setSearchWhere('');
    setActiveField(null);
    if (isHomePage) {
      navigate('/', { replace: true });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') executeSearch();
    if (e.key === 'Escape') setActiveField(null);
  };

  const showDropdown = activeField !== null;
  const isLoadingInitial = eventsLoading && events.length === 0;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex h-[72px] items-center justify-between border-b border-border bg-background backdrop-blur-md px-4 lg:px-8">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2 group min-w-max">
          <div className="size-8 group-hover:scale-110 transition-transform duration-300">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path
                className="fill-primary"
                clipRule="evenodd"
                d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z"
                fillRule="evenodd"
              ></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground hidden sm:block">EventCraft</h2>
        </Link>

        {/* ── Search Bar ── */}
        {showSearchBar && (
          <div
            ref={searchContainerRef}
            className="hidden md:flex relative flex-1 max-w-[800px] mx-6"
          >
            {/* Pill container */}
            <div className={`flex w-full items-center rounded-full border transition-all h-12 ${showDropdown ? 'bg-background shadow-md border-border' : 'bg-muted/40 border-border hover:shadow-md focus-within:shadow-md focus-within:bg-background'}`}>

              {/* What field */}
              <div className="flex flex-1 items-center pl-4 pr-2 h-full">
                <span className="material-symbols-outlined text-muted-foreground mr-2 shrink-0 text-[20px]">search</span>
                <input
                  type="text"
                  id="navbar-search-what"
                  value={searchWhat}
                  onChange={(e) => { setSearchWhat(e.target.value); setActiveField('what'); }}
                  onFocus={() => setActiveField('what')}
                  onKeyDown={handleKeyDown}
                  placeholder="Search events"
                  aria-label="Search events by name or category"
                  autoComplete="off"
                  className="bg-transparent border-none outline-none ring-0 w-full text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                />
              </div>

              <div className="h-6 w-px bg-border shrink-0" />

              {/* Where field */}
              <div className="flex flex-[0.8] items-center pl-4 pr-1 h-full">
                <span className="material-symbols-outlined text-muted-foreground mr-2 shrink-0 text-[20px]">location_on</span>
                <input
                  type="text"
                  id="navbar-search-where"
                  value={searchWhere}
                  onChange={(e) => { setSearchWhere(e.target.value); setActiveField('where'); }}
                  onFocus={() => setActiveField('where')}
                  onKeyDown={handleKeyDown}
                  placeholder="Location"
                  aria-label="Filter events by location"
                  autoComplete="off"
                  className="bg-transparent border-none outline-none ring-0 w-full text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                />

                {/* Clear (×) button — only visible when there's active search text */}
                {hasActiveSearch && (
                  <button
                    onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
                    aria-label="Clear search"
                    className="h-7 w-7 mr-1 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px] text-muted-foreground">close</span>
                  </button>
                )}

                {/* Search button */}
                <button
                  id="navbar-search-btn"
                  onMouseDown={(e) => { e.preventDefault(); executeSearch(); }}
                  aria-label="Run event search"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 ml-1 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </button>
              </div>
            </div>

            {/* ── Dropdown panel ── */}
            {showDropdown && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[200] rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {activeField === 'what' ? (
                  <EventSuggestions
                    results={filteredSuggestions}
                    loading={isLoadingInitial}
                    searchWhat={searchWhat}
                    searchWhere={searchWhere}
                    onSelect={handleSelectEvent}
                    onViewAll={() => executeSearch()}
                  />
                ) : (
                  <LocationSuggestions
                    locations={allLocations}
                    searchWhere={searchWhere}
                    onSelect={handleSelectLocation}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation & User Section */}
        <div className="flex items-center gap-4 lg:gap-6 min-w-max">
          <nav className="hidden xl:flex items-center gap-6">
            <Link to="/" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link 
              to="/#trending-experiences" 
              onClick={() => {
                setTimeout(() => {
                  document.getElementById('trending-experiences')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Find Events
            </Link>
            <Link
              to={isAuthenticated ? '/events/create' : '/organizer'}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Create Events
            </Link>
          </nav>

          {isAuthenticated ? (
            <div className="flex items-center gap-4 lg:gap-6">
              <Link
                to="/dashboard"
                className="hidden lg:block text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                Find my tickets
              </Link>

              <ThemeToggle />

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  id="navbar-profile-btn"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors border border-transparent"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden text-primary font-black text-xs uppercase shadow-sm">
                    {user?.fullName?.charAt(0) || (
                      <span className="material-symbols-outlined text-lg">person</span>
                    )}
                  </div>
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute right-0 mt-3 w-60 origin-top-right rounded-xl bg-card shadow-2xl ring-1 ring-border z-50 overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2.5 border-b border-border mb-1">
                        <p className="text-sm font-bold text-card-foreground truncate">{user?.fullName}</p>
                        <p className="text-[10px] text-muted-foreground font-medium truncate uppercase tracking-widest">
                          {user?.role || 'User'}
                        </p>
                      </div>

                      <button
                        onClick={() => { setIsSettingsOpen(true); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-card-foreground hover:bg-muted rounded-lg transition-colors group text-left"
                      >
                        <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-0.5">settings</span>
                        <span className="font-bold">Settings</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors group text-left"
                      >
                        <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-0.5">logout</span>
                        <span className="font-bold">Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 lg:gap-6">
              <ThemeToggle />
              <Link
                to="/auth/login"
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                Log In
              </Link>
            </div>
          )}
        </div>
      </header>

      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default Navbar;
