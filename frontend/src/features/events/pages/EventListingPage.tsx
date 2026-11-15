import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchEvents, deleteEvent } from '@/features/events/store/eventsSlice';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { DeleteConfirmModal } from '@/features/events/components/delete-confirm-modal';
import LoadingOverlay from '@/components/ui/loading-overlay';
import { useAuthStore } from '@/store/authStore';

type EventStatus = 'All' | 'Draft' | 'Published' | 'Scheduled' | 'Ended' | 'Cancelled';

const EventListingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EventStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { events, eventsLoading } = useAppSelector((state) => state.events);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const { can } = usePermissions();

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteEvent = (id: string, title: string) => {
    setEventToDelete({ id, title });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteEvent(eventToDelete.id)).unwrap();
      toast.success(`Event "${eventToDelete.title}" deleted successfully`);
      setIsDeleteModalOpen(false);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete event');
    } finally {
      setIsDeleting(false);
      setEventToDelete(null);
    }
  };

  useEffect(() => {
    if (events.length === 0 && !eventsLoading) {
      dispatch(fetchEvents());
    }
  }, [dispatch, events.length, eventsLoading]);

  const filteredEvents = events.filter((event) => {
    const matchesTab =
      activeTab === 'All' || event.status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.location?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="relative flex-1 flex flex-col bg-background font-display text-foreground">
      <LoadingOverlay isVisible={isDeleting} message="Deleting event..." />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Sub-header (Breadcrumbs & Actions) */}
        <div className="h-16 flex items-center justify-between px-8 shrink-0 border-b border-border">
          <div className="flex items-center gap-4">
            <nav aria-label="Breadcrumb" className="flex text-sm text-muted-foreground">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link to="/dashboard" className="hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                  <span className="text-foreground font-medium">Events</span>
                </li>
              </ol>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {can('EVENT_CREATE') && (
              <button
                onClick={() => navigate('/events/create')}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-md shadow-primary/20"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                New Event
              </button>
            )}
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {/* Header Section */}
          <div className="mb-8 flex items-end justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black tracking-tight text-foreground">Events</h1>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-bold text-muted-foreground border border-border">
                {events.length}
              </span>
            </div>
            <button
              disabled
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-50"
              title="Coming Soon"
            >
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Filter
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
          </div>

          {/* Tabs & Search */}
          <div className="mb-8 flex flex-col gap-6">
            <div className="flex border-b border-border">
              <div className="flex gap-8">
                {(
                  ['All', 'Draft', 'Published', 'Scheduled', 'Ended', 'Cancelled'] as EventStatus[]
                ).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-bold border-b-2 transition-all ${
                      activeTab === tab
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                search
              </span>
              <input
                type="text"
                placeholder="Search events by title, tag, or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-3 pl-12 pr-4 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground"
              />
            </div>
          </div>

          {/* Event Grid */}
          {eventsLoading && events.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <Link to={event.isOwner || isAdmin ? `/events/edit/${event.id}` : `/events/${event.id}`}>
                      <div
                        className="absolute inset-0 bg-muted bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${event.bannerUrl || 'https://images.unsplash.com/photo-1540575861501-7ad05823c23d?q=80&w=2070&auto=format&fit=crop'})`,
                        }}
                      ></div>
                    </Link>
                    <span
                      className={`absolute right-3 top-3 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg ${
                        event.status.toLowerCase() === 'scheduled'
                          ? 'bg-indigo-500'
                          : event.status.toLowerCase() === 'published'
                            ? 'bg-blue-500'
                            : event.status.toLowerCase() === 'draft'
                              ? 'bg-muted-foreground'
                              : event.status.toLowerCase() === 'cancelled'
                                ? 'bg-red-500'
                                : 'bg-green-500' // ended or other
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <div className="p-5">
                    <Link to={event.isOwner || isAdmin ? `/events/edit/${event.id}` : `/events/${event.id}`}>
                      <h3 className="mb-2 text-lg font-bold text-card-foreground leading-tight transition-colors group-hover:text-primary">
                        {event.title}
                      </h3>
                    </Link>
                    <div className="mb-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        <span>
                          {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}{' '}
                          •{' '}
                          {event.startDate
                            ? new Date(event.startDate).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'TBD'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        <span>
                          {event.location?.address || event.location?.city || 'Virtual/TBD'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-5">
                      <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">
                        <span>Attendance</span>
                        <span>
                          {event.status === 'scheduled' || event.status === 'published'
                            ? 'Analytics Incoming'
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${event.status === 'ended' ? 'bg-muted-foreground' : 'bg-primary'}`}
                          style={{
                            width:
                              event.status === 'scheduled' || event.status === 'published'
                                ? '45%'
                                : event.status === 'ended'
                                  ? '100%'
                                  : '0%',
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <div className="flex -space-x-2">
                        <div className="size-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] text-muted-foreground font-black">
                          ?
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(can('EVENT_DELETE') && event.isOwner) || isAdmin ? (
                          <button
                            onClick={() => handleDeleteEvent(event.id, event.title)}
                            className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete Event"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        ) : null}
                        {(can('EVENT_UPDATE') && event.isOwner) || isAdmin ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate((event.isOwner || isAdmin) ? `/events/edit/${event.id}` : `/events/${event.id}`)}
                              className="rounded-lg border border-border bg-card px-4 py-1.5 text-xs font-bold transition-colors hover:bg-muted text-card-foreground"
                            >
                              Edit
                            </button>
                          </div>
                        ) : <div />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredEvents.length === 0 && !eventsLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-6xl text-muted-foreground/30 mb-4">
                event_busy
              </span>
              <h3 className="text-xl font-bold text-muted-foreground">No events found</h3>
              <p className="text-muted-foreground/60 text-sm mt-2">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      </main>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Event"
        itemName={eventToDelete?.title || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default EventListingPage;
