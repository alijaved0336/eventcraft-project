import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_ATTENDEE_LIST_V2,
  GET_EVENT_STATS_V2,
  MANUAL_CHECK_IN,
  ASSIGN_TICKET,
  UNDO_CHECK_IN,
} from '../../../checkin/graphql/operations';
import {
  AttendeeListingV2Response,
  AttendanceStatsV2,
  CheckInResult,
  AttendeeV2,
  AttendeeFilterStatus,
} from '../../../tickets/types';
import { toast } from 'sonner';
import LoadingOverlay from '@/components/ui/loading-overlay';

const AttendanceManagementPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<AttendeeFilterStatus>('ALL');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<AttendeeV2 | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '' });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: statsData, loading: statsLoading } = useQuery<{
    getAttendanceStats: AttendanceStatsV2;
  }>(GET_EVENT_STATS_V2, { variables: { eventId }, skip: !eventId });

  const {
    data: listData,
    loading: listLoading,
    refetch: refetchList,
  } = useQuery<AttendeeListingV2Response>(GET_ATTENDEE_LIST_V2, {
    variables: {
      eventId,
      filters: {
        search: debouncedSearch,
        status: activeFilter,
      },
      page: 1,
      limit: 50,
    },
    skip: !eventId,
  });

  const [manualCheckIn, { loading: checkInLoading }] = useMutation<{
    checkInManual: CheckInResult;
  }>(MANUAL_CHECK_IN, {
    onCompleted: (data) => {
      const result = data?.checkInManual;
      if (result?.__typename === 'CheckInSuccess') {
        toast.success(`Successfully checked in ${result.attendee.fullName}`);
        refetchList();
      } else {
        toast.error(result.message || 'Check-in failed');
      }
    },
    refetchQueries: [{ query: GET_EVENT_STATS_V2, variables: { eventId } }],
  });

  const [undoCheckIn] = useMutation(UNDO_CHECK_IN, {
    onCompleted: () => {
      toast.success('Check-in undone successfully');
      refetchList();
    },
    refetchQueries: [{ query: GET_EVENT_STATS_V2, variables: { eventId } }],
  });

  const [assignTicket, { loading: assigningLoading }] = useMutation(ASSIGN_TICKET, {
    onCompleted: () => {
      toast.success('Attendee assignment updated');
      setIsEditModalOpen(false);
      refetchList();
    },
  });

  const handleEditClick = (attendee: AttendeeV2) => {
    setSelectedAttendee(attendee);
    setEditForm({
      name: attendee.attendee.name || '',
      email: attendee.attendee.email || '',
    });
    setIsEditModalOpen(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttendee) return;
    assignTicket({
      variables: {
        issuanceId: selectedAttendee.issuanceId,
        input: editForm,
      },
    });
  };

  const stats = statsData?.getAttendanceStats;
  const attendees = listData?.listAttendeesForEvent?.attendees || [];

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen">
      <LoadingOverlay isVisible={assigningLoading} message="Updating assignment..." />

      <main className="flex-1 px-8 py-12 max-w-7xl mx-auto w-full">
        <header className="mb-12">
          <div className="flex items-center gap-2 text-[0.65rem] font-bold text-primary tracking-[0.05em] uppercase mb-4">
            <span className="w-6 h-[2px] bg-primary"></span>
            ORGANIZER TOOLS
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-4">
            Attendee Management
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed font-medium">
            Real-time guest tracking and logistics. Manage tiers, check-ins, and assignments from a
            single editorial interface.
          </p>
        </header>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Total Registrations
            </p>
            <p className="text-3xl font-black text-foreground">
              {statsLoading ? '...' : stats?.total || 0}
            </p>
            <div className="mt-2 flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> Live count
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Checked-In
            </p>
            <p className="text-3xl font-black text-foreground">
              {statsLoading ? '...' : stats?.checkedIn || 0}
            </p>
            <div className="mt-2 w-full bg-muted h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-1000"
                style={{ width: `${((stats?.checkedIn || 0) / (stats?.total || 1)) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Unassigned
            </p>
            <p className="text-3xl font-black text-foreground">
              {statsLoading ? '...' : stats?.unassigned || 0}
            </p>
            <div className="mt-2 flex items-center gap-1 text-indigo-600 text-[10px] font-bold uppercase">
              <span className="material-symbols-outlined text-[14px]">info</span> Pending invites
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <section className="bg-card rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(11,28,48,0.04)] border border-border ring-1 ring-foreground/2">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border bg-muted/20">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px]">
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all text-foreground"
                placeholder="Search guests by name or email..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-card p-1 rounded-xl border border-border">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'CHECKED_IN', label: 'Checked-in' },
                { id: 'NOT_ARRIVED', label: 'Not Arrived' },
                { id: 'UNASSIGNED', label: 'Unassigned' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as AttendeeFilterStatus)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeFilter === tab.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-card text-muted-foreground font-bold text-[10px] uppercase tracking-widest border-b border-border">
                  <th className="px-6 py-5">Attendee</th>
                  <th className="px-6 py-5">Ticket Tier</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {listLoading && attendees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </td>
                  </tr>
                ) : attendees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-muted-foreground font-medium"
                    >
                      No attendees found.
                    </td>
                  </tr>
                ) : (
                  attendees.map((attendee) => (
                    <tr
                      key={attendee.issuanceId}
                      className="bg-card hover:bg-muted/30 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-muted shrink-0 flex items-center justify-center font-bold text-primary border border-primary/10">
                            {attendee.attendee.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-bold text-card-foreground">
                              {attendee.attendee.name || 'Unassigned'}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {attendee.attendee.email || (
                                <span className="italic text-[10px] opacity-60">
                                  Pending Invite
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">
                          {attendee.ticketType.name}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              attendee.checkedIn
                                ? 'bg-emerald-500'
                                : attendee.attendee.isUnassigned
                                  ? 'bg-orange-400'
                                  : 'bg-muted-foreground'
                            }`}
                          ></span>
                          <span className="text-sm font-medium text-foreground">
                            {attendee.checkedIn
                              ? 'Checked-in'
                              : attendee.attendee.isUnassigned
                                ? 'Unassigned'
                                : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!attendee.checkedIn ? (
                            <>
                              <button
                                onClick={() =>
                                  manualCheckIn({ variables: { issuanceId: attendee.issuanceId } })
                                }
                                disabled={checkInLoading}
                                className="text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded bg-primary/5 hover:bg-primary/10 transition-colors"
                              >
                                Check-In
                              </button>
                              <button
                                onClick={() => handleEditClick(attendee)}
                                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() =>
                                undoCheckIn({
                                  variables: { ticketIssuanceId: attendee.issuanceId },
                                })
                              }
                              className="text-muted-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded bg-muted hover:bg-muted/80 transition-colors"
                            >
                              Undo
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-card border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              Showing <span className="font-bold text-foreground">{attendees.length}</span> of{' '}
              <span className="font-bold text-foreground">{stats?.total || 0}</span> attendees
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled
                className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-8 h-8 rounded bg-primary text-primary-foreground text-xs font-bold">
                1
              </button>
              <button className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Edit Assignment Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          ></div>
          <div className="relative bg-card rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-border">
            <form onSubmit={handleAssignSubmit} className="p-8 text-left">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold tracking-tight text-card-foreground">
                  Edit Assignment
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-muted rounded-full"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Attendee Name
                  </label>
                  <input
                    required
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-card-foreground"
                    placeholder="e.g. Julianne Moore"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Email Address
                  </label>
                  <input
                    required
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-card-foreground"
                    placeholder="email@example.com"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-10 bg-primary text-primary-foreground py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              >
                Update Assignment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button for Scanner (Staff View Link) */}
      <Link
        to={`/events/${eventId}/checkin`}
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group z-40"
        title="Go to Scanner App"
      >
        <span className="material-symbols-outlined text-[32px] group-hover:rotate-12 transition-transform">
          qr_code_scanner
        </span>
      </Link>
    </div>
  );
};

export default AttendanceManagementPage;

// Add this to your index.css or global styles for scanning animation
// @keyframes scanning-line {
//   0% { top: 0; }
//   100% { top: 100%; }
// }
