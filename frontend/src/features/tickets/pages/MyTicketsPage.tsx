import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_MY_TICKETS_V2 } from '../graphql/operations';
import { ASSIGN_TICKET } from '../../checkin/graphql/operations';
import { MyTicketV2, AssignmentInput } from '../types';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import LoadingOverlay from '@/components/ui/loading-overlay';

/**
 * Page to view and manage user's digital tickets.
 */
const MyTicketsPage: React.FC = () => {
  const {
    data,
    loading: ticketsLoading,
    refetch,
  } = useQuery<{ myTickets: MyTicketV2[] }>(GET_MY_TICKETS_V2);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MyTicketV2 | null>(null);
  const [assignForm, setAssignForm] = useState<AssignmentInput>({ name: '', email: '' });

  const [assignTicket, { loading: assigningLoading }] = useMutation(ASSIGN_TICKET, {
    onCompleted: () => {
      toast.success('Ticket assigned successfully');
      setIsAssignModalOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to assign ticket');
    },
  });

  const handleAssignClick = (ticket: MyTicketV2) => {
    setSelectedTicket(ticket);
    setAssignForm({
      name: ticket.assignedTo?.name || '',
      email: ticket.assignedTo?.email || '',
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    assignTicket({
      variables: {
        issuanceId: selectedTicket.issuanceId,
        input: assignForm,
      },
    });
  };

  const tickets = data?.myTickets || [];

  if (ticketsLoading && tickets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background min-h-screen">
      <LoadingOverlay isVisible={assigningLoading} message="Assigning ticket..." />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12">
          <div className="flex items-center gap-2 text-[0.65rem] font-bold text-primary tracking-[0.05em] uppercase mb-4">
            <span className="w-6 h-[2px] bg-primary"></span>
            Attendee Portal
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2">
            My Digital Passes
          </h1>
          <p className="text-muted-foreground font-medium">
            Manage your event access, invite guests, and view your digital tickets.
          </p>
        </header>

        {tickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tickets.map((ticket: MyTicketV2) => (
              <div
                key={ticket.issuanceId}
                className="bg-card rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300"
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                      {ticket.ticketType.name}
                    </span>
                    {ticket.checkedIn && (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Used
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black tracking-tight text-foreground mb-2 leading-tight">
                    {ticket.event.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground mb-8">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      {new Date(ticket.event.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      {ticket.event.location.city}
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-2xl p-5 border border-border mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3">
                      Assigned To
                    </p>
                    {ticket.assignedTo?.name ? (
                      <div>
                        <p className="text-sm font-black text-foreground">
                          {ticket.assignedTo.name}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {ticket.assignedTo.email}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-indigo-500 italic text-xs font-bold">
                        <span className="material-symbols-outlined text-[16px]">person_add</span>
                        Waiting for Guest Info
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {ticket.assignedTo?.name ? (
                      <Link
                        to={`/tickets/pass/${ticket.issuanceId}`}
                        className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                      >
                        <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                        View Ticket
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleAssignClick(ticket)}
                        className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                      >
                        <span className="material-symbols-outlined text-[16px]">person_add</span>
                        Assign Guest
                      </button>
                    )}
                    <button
                      onClick={() => handleAssignClick(ticket)}
                      className="p-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-all border border-border"
                      title="Manage Guest"
                    >
                      <span className="material-symbols-outlined text-[18px]">settings</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-card rounded-[3rem] border border-border shadow-sm animate-in fade-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground/30 border border-border">
              <span className="material-symbols-outlined text-4xl">confirmation_number</span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-foreground mb-2">
              No active tickets
            </h3>
            <p className="text-muted-foreground font-medium mb-8">
              Ready for your next experience? Explore upcoming events.
            </p>
            <Link
              to="/dashboard/events"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-100 transition-all"
            >
              Browse Events
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        )}
      </main>

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsAssignModalOpen(false)}
          ></div>
          <div className="relative bg-card rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <form onSubmit={handleAssignSubmit} className="p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-foreground">
                    Guest Details
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    Assignment Portal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="w-10 h-10 hover:bg-muted rounded-full flex items-center justify-center transition-colors text-foreground"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Full Name
                  </label>
                  <input
                    required
                    className="w-full bg-muted/30 border border-border rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground/40"
                    placeholder="e.g. Julianne Moore"
                    value={assignForm.name}
                    onChange={(e) => setAssignForm({ ...assignForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Email Address
                  </label>
                  <input
                    required
                    className="w-full bg-muted/30 border border-border rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground/40"
                    placeholder="guest@example.com"
                    type="email"
                    value={assignForm.email}
                    onChange={(e) => setAssignForm({ ...assignForm, email: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-10 bg-primary text-primary-foreground py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                Authorize Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;
