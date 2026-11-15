import Stripe from 'stripe';
import { config } from '../config';

export class PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2026-03-25.dahlia' as any, // Cast if necessary, or use the exact string
    });
  }

  async createPaymentIntent(amount: number, currency: string, metadata: Record<string, string>) {
    return await this.stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });
  }

  constructEvent(payload: string | Buffer, sig: string) {
    return this.stripe.webhooks.constructEvent(payload, sig, config.stripeWebhookSecret);
  }

  async retrievePaymentIntent(id: string) {
    return await this.stripe.paymentIntents.retrieve(id);
  }
}
