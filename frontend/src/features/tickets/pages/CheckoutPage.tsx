import React, { useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useMutation } from '@apollo/client/react';
import { CREATE_ORDER } from '../graphql/operations';
import { CreateOrderResponse, CreateOrderInput } from '../types';
import StripePaymentForm from '../components/StripePaymentForm';
import { useAppSelector } from '@/store/hooks';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
);

interface GuestInfo {
  ticketTypeId: string;
  typeName: string;
  name: string;
  email: string;
}

interface CheckoutItem {
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  price: number;
}

const CheckoutPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { items, totalAmount } = (location.state as {
    items: CheckoutItem[];
    totalAmount: number;
  }) || { items: [], totalAmount: 0 };

  const { events } = useAppSelector((state) => state.events);
  const event = events.find((e) => e.id === eventId);
  const { user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [paymentData, setPaymentData] = useState<{ orderId: string; clientSecret: string } | null>(
    null,
  );

  // Initialize guest info based on items
  const [guests, setGuests] = useState<GuestInfo[]>(() => {
    const initialGuests: GuestInfo[] = [];
    (items || []).forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        initialGuests.push({
          ticketTypeId: item.ticketTypeId,
          typeName: item.ticketTypeName || 'Ticket',
          name: i === 0 ? user?.fullName || '' : '',
          email: i === 0 ? user?.email || '' : '',
        });
      }
    });
    return initialGuests;
  });

  const [createOrder] = useMutation<CreateOrderResponse, { input: CreateOrderInput }>(CREATE_ORDER);

  const handleStartPayment = async () => {
    if (!eventId) return;

    // Map guests back to items structure for API
    const itemsWithAttendees = items.map((item) => {
      const itemGuests = guests.filter((g) => g.ticketTypeId === item.ticketTypeId);
      return {
        ticketTypeId: item.ticketTypeId,
        quantity: item.quantity,
        attendees: itemGuests.map((g) => ({
          name: g.name,
          email: g.email,
        })),
      };
    });

    try {
      const { data } = await createOrder({
        variables: {
          input: {
            eventId,
            items: itemsWithAttendees,
          },
        },
      });

      if (!data?.createOrder) return;

      const { order, clientSecret } = data.createOrder;

      if (!clientSecret) {
        navigate(`/orders/success/${order.id}`);
        return;
      }

      setStep(3);
      setPaymentData({ orderId: order.id, clientSecret });
    } catch (err) {
      console.error('Error creating order:', err);
      toast.error('Failed to create order. Please try again.');
    }
  };

  const updateGuest = (index: number, field: keyof GuestInfo, value: string) => {
    setGuests((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value } as GuestInfo;
      return next;
    });
  };

  if (!event || items.length === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4 bg-background">
        <p className="text-xl font-bold text-foreground">No tickets selected or event not found</p>
        <button
          onClick={() => navigate('/dashboard/events')}
          className="text-primary font-bold hover:underline"
        >
          Return to Events
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col antialiased">
      <main className="grow pt-24 pb-12 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Form Steps */}
          <div className="lg:col-span-7 space-y-10">
            {step === 1 && (
              <div className="space-y-8 bg-card p-8 rounded-xl shadow-sm border border-border animate-in fade-in slide-in-from-left-4 duration-500">
                <header className="mb-0 text-left">
                  <div className="flex items-center gap-2 text-[0.6rem] font-bold text-primary tracking-[0.2em] uppercase mb-4">
                    <span className="w-8 h-[2px] bg-primary"></span>
                    Step 01 / 03
                  </div>
                  <h1 className="text-3xl font-black text-card-foreground tracking-tight mb-3">
                    Registration Preview
                  </h1>
                  <p className="text-muted-foreground leading-relaxed">
                    You've selected{' '}
                    <span className="text-foreground font-bold">
                      {items.reduce((acc, item) => acc + item.quantity, 0)} tickets
                    </span>
                    . Next, we'll collect the names of your guests to personalize their experience.
                  </p>
                </header>

                <div className="py-6 border-y border-border flex flex-col gap-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase">
                      {user?.fullName?.charAt(0) || (
                        <span className="material-symbols-outlined text-2xl">person</span>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-black text-card-foreground text-lg leading-none">
                        {user?.fullName || 'Guest User'}
                      </p>
                      <p className="text-muted-foreground font-medium mt-1">
                        {user?.email || 'Logged in account'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-semibold"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_back</span> Edit
                    Selection
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="px-10 py-4 rounded-xl font-black text-sm transition-all shadow-xl bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] shadow-primary/30 flex items-center gap-2"
                  >
                    Personalize Tickets
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleStartPayment();
                }}
                className="space-y-8 bg-card p-8 rounded-2xl shadow-sm border border-border animate-in fade-in slide-in-from-right-4 duration-500"
              >
                <header className="mb-0 text-left">
                  <div className="flex items-center gap-2 text-[0.6rem] font-bold text-primary tracking-[0.2em] uppercase mb-4">
                    <span className="w-8 h-[2px] bg-primary"></span>
                    Step 02 / 03
                  </div>
                  <h1 className="text-3xl font-black text-card-foreground tracking-tight mb-3">
                    Attendee Information
                  </h1>
                  <p className="text-muted-foreground leading-relaxed">
                    Personalize each ticket with a name and email. Digital passes will be sent
                    directly to these addresses.
                  </p>
                </header>

                <div className="space-y-6">
                  {guests.map((guest, index) => (
                    <div
                      key={index}
                      className="p-6 rounded-2xl bg-muted border border-border shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                          Ticket {index + 1} — {guest.typeName}
                        </p>
                        {index === 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase border border-emerald-500/20">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">
                            Full Name
                          </label>
                          <input
                            required
                            type="text"
                            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all outline-none text-card-foreground"
                            value={guest.name}
                            onChange={(e) => updateGuest(index, 'name', e.target.value)}
                            placeholder="e.g. Julianne Moore"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">
                            Email Address
                          </label>
                          <input
                            required
                            type="email"
                            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all outline-none text-card-foreground"
                            value={guest.email}
                            onChange={(e) => updateGuest(index, 'email', e.target.value)}
                            placeholder="guest@example.com"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-semibold"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_back</span> Back
                  </button>
                  <button
                    type="submit"
                    className="px-10 py-4 rounded-xl font-black text-sm transition-all shadow-xl bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] shadow-primary/30 flex items-center gap-2"
                  >
                    Secure Checkout
                    <span className="material-symbols-outlined text-lg">lock</span>
                  </button>
                </div>
              </form>
            )}

            {step === 3 && paymentData && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret: paymentData.clientSecret }}
                >
                  <StripePaymentForm
                    orderId={paymentData.orderId}
                    totalAmount={totalAmount}
                    clientSecret={paymentData.clientSecret}
                  />
                </Elements>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 text-left">
            <div className="bg-card rounded-3xl shadow-lg border border-border overflow-hidden">
              <div className="h-48 w-full overflow-hidden bg-muted">
                <img
                  src={
                    event.bannerImage ||
                    'https://images.unsplash.com/photo-1540575861501-7ad05823c23d?q=80&w=2070&auto=format&fit=crop'
                  }
                  alt="Event Banner"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-1">
                  <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-border">
                    Order Summary
                  </span>
                  <h2 className="text-2xl font-bold text-card-foreground leading-tight">
                    {event.title}
                  </h2>
                  <div className="flex items-center gap-4 text-muted-foreground text-sm py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                      <span>{new Date(event.startDate || '').toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      <span className="truncate">
                        {typeof event.location === 'string'
                          ? event.location
                          : event.location?.city || 'TBD'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold text-card-foreground">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-muted-foreground">Tax / Service Fee</span>
                    <span className="font-bold text-card-foreground">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <span className="text-lg font-black text-card-foreground">Total</span>
                    <span className="text-2xl font-black text-primary">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg flex gap-3 border border-border/50">
                  <span className="material-symbols-outlined text-amber-500">info</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Tickets are non-refundable after 48 hours before the event. By completing
                    purchase, you agree to our{' '}
                    <a href="#" className="text-primary font-bold hover:underline">
                      Terms of Service
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-primary/20 bg-muted">
                <img src="https://i.pravatar.cc/150?u=1" alt="User Avatar" />
              </div>
              <div>
                <p className="text-sm italic text-muted-foreground text-left leading-relaxed">
                  "The most seamless ticketing experience I've used this year."
                </p>
                <p className="text-[10px] font-black text-primary uppercase mt-1.5 tracking-wider">
                  David Chen • Creative Director @ Flux
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
