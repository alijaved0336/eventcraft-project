import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface StripePaymentFormProps {
  orderId: string;
  totalAmount: number;
  clientSecret: string;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  orderId,
  totalAmount,
  clientSecret,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setIsProcessing(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (error) {
      toast.error(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      toast.success('Payment successful!');
      navigate(`/orders/success/${orderId}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-surface-container-low p-8 rounded-xl shadow-sm text-left"
    >
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight mb-2">Payment Details</h1>
        <p className="text-on-surface-variant">
          Complete your purchase by providing your payment information.
        </p>
      </header>

      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant px-1">
            Card Information
          </label>
          <div className="p-4 bg-surface-container-lowest border-0 rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#0b1c30',
                    '::placeholder': {
                      color: '#767586',
                    },
                  },
                  invalid: {
                    color: '#ba1a1a',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-lg border border-primary/5">
        <span
          className="material-symbols-outlined text-primary scale-110"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          verified
        </span>
        <div>
          <p className="text-sm font-bold text-on-surface text-left">Secure Payment Processing</p>
          <p className="text-xs text-on-surface-variant text-left">
            Your transaction is encrypted with 256-bit SSL security protocol.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-5 rounded-xl text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:bg-slate-200 disabled:text-slate-400"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          lock
        </span>
        {isProcessing ? 'Processing...' : `Complete Purchase — $${totalAmount.toFixed(2)}`}
      </button>

      <div className="flex justify-center items-center gap-8 opacity-40 grayscale">
        <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase">
          <span className="material-symbols-outlined text-sm">account_balance</span> STRIPE
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase">
          <span className="material-symbols-outlined text-sm">shield</span> PCI COMPLIANT
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase">
          <span className="material-symbols-outlined text-sm">key</span> SSL ENCRYPTED
        </div>
      </div>
    </form>
  );
};

export default StripePaymentForm;
