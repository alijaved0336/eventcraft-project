import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';

interface GlobalSearchBarProps {
  onSearch?: (
    query: string,
    locationName: string,
    date: string,
    lat?: number,
    lng?: number,
  ) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ onSearch }) => {
  const navigate = useNavigate();

  // Search States
  const [query, setQuery] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [date, setDate] = useState('');

  const { events } = useAppSelector((state) => state.events);

  const uniqueLocations = useMemo(() => {
    const locMap = new Map<string, { lat?: number | undefined; lng?: number | undefined }>();
    events.forEach((event) => {
      const city = event.location?.city;
      if (city) {
        const key = event.location?.country ? `${city}, ${event.location.country}` : city;
        if (!locMap.has(key)) {
          locMap.set(key, { lat: event.location?.lat, lng: event.location?.lng });
        }
      }
    });
    return Array.from(locMap.entries()).map(([name, coords]) => ({ name, ...coords }));
  }, [events]);

  const [showLocationAutocomplete, setShowLocationAutocomplete] = useState(false);

  const locationSuggestions = useMemo(() => {
    if (locationName.trim().length === 0) {
      // If empty, show some top popular event locations by default if we want, or nothing
      return uniqueLocations.slice(0, 5);
    }
    return uniqueLocations.filter((loc) =>
      loc.name.toLowerCase().includes(locationName.toLowerCase()),
    );
  }, [uniqueLocations, locationName]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    events.forEach((event) => {
      event.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [events]);

  const uniqueDates = useMemo(() => {
    const dates = new Map<string, string>();
    events.forEach((event) => {
      if (event.startDate) {
        const raw = event.startDate.split('T')[0];
        if (!raw) return;

        const formatted = new Date(event.startDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        if (!dates.has(raw)) dates.set(raw, formatted);
      }
    });
    return Array.from(dates.entries())
      .map(([raw, formatted]) => ({ raw, formatted }))
      .sort((a, b) => a.raw.localeCompare(b.raw));
  }, [events]);

  const [showQueryAutocomplete, setShowQueryAutocomplete] = useState(false);
  const [showDateAutocomplete, setShowDateAutocomplete] = useState(false);
  const [dateDisplay, setDateDisplay] = useState('');

  const querySuggestions = useMemo(() => {
    if (query.trim().length === 0) {
      return uniqueTags.slice(0, 6);
    }
    return uniqueTags.filter((tag) => tag.toLowerCase().includes(query.toLowerCase()));
  }, [uniqueTags, query]);

  const dateSuggestions = useMemo(() => {
    if (dateDisplay.trim().length === 0) {
      return uniqueDates.slice(0, 6);
    }
    return uniqueDates.filter(
      (d) =>
        d.formatted.toLowerCase().includes(dateDisplay.toLowerCase()) ||
        d.raw.includes(dateDisplay),
    );
  }, [uniqueDates, dateDisplay]);

  const submitSearch = () => {
    if (onSearch) {
      onSearch(query, locationName, date, lat, lng);
      // Optional: scroll to the trending experiences section
      const element = document.getElementById('trending-experiences');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (locationName) params.set('city', locationName);
    if (lat && lng) {
      params.set('lat', lat.toString());
      params.set('lng', lng.toString());
    }
    if (date) params.set('date', date);

    navigate(`/events?${params.toString()}`);
  };

  return (
    <div className="max-w-5xl mx-auto bg-card rounded-2xl md:rounded-full shadow-[0_30px_60px_-15px_rgba(30,25,40,0.08)] p-2 flex flex-col md:flex-row items-center mb-12 border border-border relative z-50">
      {/* "WHAT" Field with Custom Tag Autocomplete */}
      <div className="flex-1 w-full px-6 py-2 flex flex-col items-start md:border-r border-border last:border-0 group relative z-50">
        <label className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-primary mb-1 ml-1 leading-none">
          What
        </label>
        <div className="flex items-center gap-3 w-full relative">
          <span className="material-symbols-outlined text-muted-foreground text-lg group-focus-within:text-primary transition-colors">
            search
          </span>
          <input
            className="bg-transparent border-none focus:ring-0 w-full text-card-foreground placeholder:text-muted-foreground text-sm font-bold p-0 pr-6 outline-none"
            placeholder="Music, Tech, Design..."
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowQueryAutocomplete(true);
            }}
            onFocus={() => setShowQueryAutocomplete(true)}
            onBlur={() => setTimeout(() => setShowQueryAutocomplete(false), 200)}
            onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-0 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center p-1"
            >
              <span className="material-symbols-outlined text-[1rem]">close</span>
            </button>
          )}

          {/* Autocomplete Dropdown for WHAT */}
          {showQueryAutocomplete && querySuggestions.length > 0 && (
            <div className="absolute top-full left-[-24px] right-[-24px] mt-4 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 text-[0.65rem] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50">
                Event Categories
              </div>
              {querySuggestions.map((tag) => (
                <div
                  key={tag}
                  className="px-4 py-3 hover:bg-muted cursor-pointer flex flex-col border-b border-border/50 last:border-0"
                  onMouseDown={() => {
                    setQuery(tag);
                    setShowQueryAutocomplete(false);
                  }}
                >
                  <div className="text-sm font-bold text-card-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-[1rem] text-primary">sell</span>
                    {tag}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* "WHERE" Field with Custom Event Location Autocomplete */}
      <div className="flex-1 w-full px-6 py-2 flex flex-col items-start md:border-r border-border last:border-0 group relative z-50">
        <label className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-primary mb-1 ml-1 leading-none">
          Where
        </label>
        <div className="flex items-center gap-3 w-full relative">
          <span className="material-symbols-outlined text-muted-foreground text-lg group-focus-within:text-primary transition-colors">
            location_on
          </span>
          <input
            className="bg-transparent border-none focus:ring-0 w-full text-card-foreground placeholder:text-muted-foreground text-sm font-bold p-0 pr-6 outline-none"
            placeholder="San Francisco, CA"
            type="text"
            value={locationName}
            onChange={(e) => {
              setLocationName(e.target.value);
              setLat(undefined);
              setLng(undefined);
              setShowLocationAutocomplete(true);
            }}
            onFocus={() => setShowLocationAutocomplete(true)}
            onBlur={() => setTimeout(() => setShowLocationAutocomplete(false), 200)}
            onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
          />
          {locationName && (
            <button
              onClick={() => {
                setLocationName('');
                setLat(undefined);
                setLng(undefined);
              }}
              className="absolute right-0 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center p-1"
            >
              <span className="material-symbols-outlined text-[1rem]">close</span>
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {showLocationAutocomplete && locationSuggestions.length > 0 && (
            <div className="absolute top-full left-[-24px] right-[-24px] mt-4 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 text-[0.65rem] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50">
                Event Locations
              </div>
              {locationSuggestions.map((loc) => (
                <div
                  key={loc.name}
                  className="px-4 py-3 hover:bg-muted cursor-pointer flex flex-col border-b border-border/50 last:border-0"
                  onMouseDown={() => {
                    setLocationName(loc.name);
                    setLat(loc.lat);
                    setLng(loc.lng);
                    setShowLocationAutocomplete(false);
                  }}
                >
                  <div className="text-sm font-bold text-card-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-[1rem] text-primary">
                      location_on
                    </span>
                    {loc.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* "WHEN" Field with Custom Date Autocomplete */}
      <div className="flex-1 w-full px-6 py-2 flex flex-col items-start md:border-r border-border last:border-0 group relative z-40">
        <label className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-primary mb-1 ml-1 leading-none">
          When
        </label>
        <div className="flex items-center gap-3 w-full relative">
          <span className="material-symbols-outlined text-muted-foreground text-lg group-focus-within:text-primary transition-colors pointer-events-none z-10">
            calendar_today
          </span>
          <input
            className="bg-transparent border-none focus:ring-0 w-full text-card-foreground placeholder:text-muted-foreground text-sm font-bold p-0 pr-6 z-0 outline-none"
            placeholder="Any date"
            type="text"
            value={dateDisplay}
            onChange={(e) => {
              setDateDisplay(e.target.value);
              setDate(''); // clear actual search date if they are typing manually
              setShowDateAutocomplete(true);
            }}
            onFocus={() => setShowDateAutocomplete(true)}
            onBlur={() => setTimeout(() => setShowDateAutocomplete(false), 200)}
            onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
          />
          {dateDisplay && (
            <button
              onClick={() => {
                setDateDisplay('');
                setDate('');
              }}
              className="absolute right-0 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center p-1 z-20"
            >
              <span className="material-symbols-outlined text-[1rem]">close</span>
            </button>
          )}

          {/* Autocomplete Dropdown for WHEN */}
          {showDateAutocomplete && dateSuggestions.length > 0 && (
            <div className="absolute top-full left-[-24px] right-[-24px] mt-4 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 text-[0.65rem] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50">
                Event Dates
              </div>
              {dateSuggestions.map((d) => (
                <div
                  key={d.raw}
                  className="px-4 py-3 hover:bg-muted cursor-pointer flex flex-col border-b border-border/50 last:border-0"
                  onMouseDown={() => {
                    setDateDisplay(d.formatted);
                    setDate(d.raw);
                    setShowDateAutocomplete(false);
                  }}
                >
                  <div className="text-sm font-bold text-card-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-[1rem] text-primary">
                      event
                    </span>
                    {d.formatted}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={submitSearch}
        className="w-full md:w-auto bg-primary text-primary-foreground px-10 py-4 rounded-xl md:rounded-full font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2 md:mt-0"
      >
        Enter
      </button>
    </div>
  );
};
