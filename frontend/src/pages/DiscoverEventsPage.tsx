import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { DISCOVER_EVENTS } from '@/features/events/graphql/operations';
import { GlobalSearchBar } from '@/features/events/components/GlobalSearchBar';

interface DiscoverEvent {
  id: string;
  slug?: string;
  title: string;
  bannerUrl?: string;
  startDate?: string;
  tags?: string[];
  price?: number;
  currency?: string;
  location?: {
    city?: string | null;
    country?: string | null;
  } | null;
}

interface DiscoverData {
  discoverEvents: {
    events: DiscoverEvent[];
    totalCount: number;
    hasMore: boolean;
  };
}

const DiscoverEventsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat') as string) : undefined;
  const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng') as string) : undefined;
  const date = searchParams.get('date') || '';

  const [offset, setOffset] = useState(0);
  const limit = 12;

  const { data, loading, error, fetchMore } = useQuery<DiscoverData>(DISCOVER_EVENTS, {
    variables: {
      query: query || undefined,
      lat: lat || undefined,
      lng: lng || undefined,
      radiusInMeters: 50000,
      date: date || undefined,
      limit,
      offset: 0, // initial fetch
    },
    fetchPolicy: 'cache-and-network',
  });

  const events = data?.discoverEvents?.events || [];
  const totalCount = data?.discoverEvents?.totalCount || 0;
  const hasMore = data?.discoverEvents?.hasMore || false;

  const loadMore = () => {
    const nextOffset = offset + limit;
    fetchMore({
      variables: {
        offset: nextOffset,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          discoverEvents: {
            ...fetchMoreResult.discoverEvents,
            events: [...prev.discoverEvents.events, ...fetchMoreResult.discoverEvents.events],
          },
        };
      },
    });
    setOffset(nextOffset);
  };

  return (
    <div className="bg-background min-h-screen pt-24 px-8 pb-12 font-display">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-black tracking-tighter mb-4 text-foreground">
          Discover Events
        </h1>
        <p className="text-muted-foreground font-medium mb-12 max-w-2xl text-lg">
          Explore a curated selection of upcoming experiences tailored to your interests and
          location.
        </p>

        <div className="mb-16">
          <GlobalSearchBar />
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-end mb-8 border-b border-border pb-4">
          <h2 className="text-2xl font-black tracking-tighter text-foreground flex items-baseline gap-2">
            Search Results
            {!loading && (
              <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {totalCount} found
              </span>
            )}
          </h2>
        </div>

        {loading && events.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted aspect-4/5 rounded-2xl mb-4"></div>
                <div className="flex gap-4">
                  <div className="w-14 h-16 bg-muted rounded-xl"></div>
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive p-6 rounded-2xl font-medium border border-destructive/20">
            Failed to load events. Please try again later.
          </div>
        )}

        {!loading && events.length === 0 && !error && (
          <div className="text-center py-24 bg-muted/20 rounded-3xl border border-dashed border-border">
            <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4">
              search_off
            </span>
            <h3 className="text-2xl font-bold text-foreground mb-2">No experiences found</h3>
            <p className="text-muted-foreground font-medium">
              Try adjusting your search criteria, trying a different location, or removing filters.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {events.map((event: DiscoverEvent) => {
            const dateObj = new Date(event.startDate || '2025-01-01');
            const month = dateObj.toLocaleString('default', { month: 'short' });
            const day = event.startDate ? dateObj.getDate().toString().padStart(2, '0') : '--';

            return (
              <Link
                key={event.id}
                to={`/events/${event.slug || event.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group cursor-pointer flex flex-col"
              >
                <div className="relative aspect-4/5 rounded-2xl overflow-hidden mb-5 shadow-sm border border-border bg-muted flex-none">
                  <img
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={event.title}
                    src={
                      event.bannerUrl ||
                      'https://images.unsplash.com/photo-1540575861501-7ad060e39fe1?q=80&w=600&auto=format&fit=crop'
                    }
                  />
                  {event.tags?.[0] && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-card/90 backdrop-blur-md text-foreground text-[0.65rem] font-black uppercase px-3 py-1.5 rounded-lg tracking-widest shadow-sm">
                        {event.tags[0]}
                      </span>
                    </div>
                  )}
                  {event.price !== undefined && (
                    <div className="absolute bottom-4 right-4">
                      <span className="bg-foreground text-background text-sm font-black px-3 py-1.5 rounded-lg shadow-sm">
                        {event.price === 0 ? 'Free' : `${event.currency || '$'}${event.price}`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  <div className="flex-none flex flex-col items-center bg-muted border border-border rounded-xl p-3 h-fit group-hover:border-primary/30 transition-colors">
                    <span className="text-[0.6rem] font-black uppercase tracking-widest text-primary">
                      {month}
                    </span>
                    <span className="text-xl font-black text-foreground leading-none">{day}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-start">
                    <h3 className="text-lg font-extrabold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[0.8rem] font-bold mt-1">
                      <span className="material-symbols-outlined text-[1.1rem]">location_on</span>
                      <span className="truncate">
                        {event.location?.city || 'Virtual'}
                        {event.location?.country ? `, ${event.location.country}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {hasMore && (
          <div className="mt-16 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="bg-card border border-border text-foreground px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:border-primary hover:text-primary transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverEventsPage;
