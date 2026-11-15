import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_TICKET_TYPES } from '../graphql/operations';
import { TicketType } from '../types';
import { useNavigate } from 'react-router-dom';

interface TicketSelectionProps {
  eventId: string;
  initialTicketTypes?: TicketType[];
}

const TicketSelection: React.FC<TicketSelectionProps> = ({ eventId, initialTicketTypes }) => {
  const navigate = useNavigate();
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});

  const queryVariables = React.useMemo(() => ({ eventId }), [eventId]);

  const { data, loading, error } = useQuery<{ ticketTypes: TicketType[] }>(GET_TICKET_TYPES, {
    variables: queryVariables,
    skip: !!initialTicketTypes,
  });

  const tickets = initialTicketTypes || data?.ticketTypes || [];

  const handleQuantityChange = (ticketId: string, delta: number) => {
    setSelectedTickets((prev) => {
      const current = prev[ticketId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [ticketId]: next };
    });
  };

  const totalAmount =
    tickets.reduce((acc: number, ticket: TicketType) => {
      return acc + (selectedTickets[ticket.id] || 0) * (ticket.price / 100);
    }, 0) || 0;

  const totalCount = Object.values(selectedTickets).reduce(
    (acc: number, qty: number) => acc + qty,
    0,
  );

  const handleCheckout = () => {
    if (totalCount === 0) return;

    // Pass selected tickets to checkout page via state or context
    const items = Object.entries(selectedTickets)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([id, qty]) => ({ ticketTypeId: id, quantity: qty as number }));

    navigate(`/events/${eventId}/checkout`, { state: { items, totalAmount } });
  };

  if (loading)
    return (
      <div className="p-8 text-center bg-card rounded-xl shadow-sm border border-border">
        <span className="material-symbols-outlined animate-spin text-primary mb-2">
          progress_activity
        </span>
        <p className="text-muted-foreground font-medium">Loading tickets...</p>
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-destructive bg-card rounded-xl shadow-sm border border-border">
        <span className="material-symbols-outlined mb-2">error</span>
        <p className="font-bold">Error loading tickets</p>
      </div>
    );

  const ticketsList = tickets;

  return (
    <div className="sticky top-24 bg-card p-8 rounded-xl shadow-sm border border-border">
      <h3 className="text-xl font-black mb-6 text-card-foreground">Select Tickets</h3>
      <div className="space-y-4 mb-8">
        {ticketsList
          .filter((t: TicketType) => t.isActive)
          .map((ticket: TicketType) => {
            const quantity = selectedTickets[ticket.id] || 0;
            const isMostPopular = ticket.name === 'General Admission'; // Mocking popular tag

            return (
              <div
                key={ticket.id}
                className={`p-4 rounded-lg border transition-all ${
                  isMostPopular
                    ? 'border-primary/40 bg-primary/5 relative scale-[1.02] shadow-sm'
                    : 'border-border/50 bg-muted/30 hover:bg-muted/50'
                }`}
              >
                {isMostPopular && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                    Most Popular
                  </div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <div className="text-left">
                    <p className="font-bold text-card-foreground">{ticket.name}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {ticket.description}
                    </p>
                  </div>
                  <span
                    className={`font-black ${ticket.price === 0 ? 'text-primary' : 'text-card-foreground'}`}
                  >
                    {ticket.price === 0 ? 'Free' : `$${(ticket.price / 100).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-end items-center gap-3 mt-4">
                  <button
                    onClick={() => handleQuantityChange(ticket.id, -1)}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground active:scale-90 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="font-black w-6 text-center text-card-foreground">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(ticket.id, 1)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-md ${
                      isMostPopular
                        ? 'bg-primary text-primary-foreground hover:brightness-110'
                        : 'bg-primary/20 text-primary hover:bg-primary/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      <div className="pt-6 border-t border-border">
        <div className="flex justify-between items-center mb-6">
          <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
            Subtotal
          </span>
          <span className="text-2xl font-black text-card-foreground">
            ${totalAmount.toFixed(2)}
          </span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={totalCount === 0}
          className={`w-full font-black py-4 rounded-xl transition-all duration-150 active:scale-[0.98] shadow-lg ${
            totalCount > 0
              ? 'bg-primary text-primary-foreground hover:brightness-110 shadow-primary/20'
              : 'bg-muted text-muted-foreground/30 border border-border cursor-not-allowed shadow-none'
          }`}
        >
          {totalCount > 0 ? `Get ${totalCount} Tickets` : 'Select Tickets'}
        </button>
        <p className="text-center text-[9px] text-muted-foreground mt-4 font-bold uppercase tracking-widest opacity-60">
          Secure Checkout powered by EventCraft
        </p>
      </div>
    </div>
  );
};

export default TicketSelection;
