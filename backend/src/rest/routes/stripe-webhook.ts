import type { Request, Response } from 'express';
import express, { Router } from 'express';
import { PaymentService } from '../../services/payment.service';
import { OrderService } from '../../services/order.service';
import { logger } from '../../lib/logger';
import type Stripe from 'stripe';

const stripeWebhookRouter: Router = Router();
const paymentService = new PaymentService();
const orderService = new OrderService();

// IMPORTANT: Use express.raw() to get the raw body for signature verification
/**
 * @swagger
 * /api/webhooks/stripe:
 *   post:
 *     summary: Stripe Webhook Handler
 *     description: Receives and processes events from Stripe (e.g., payment success/failure).
 *     tags: [Payments]
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe webhook signature for security verification.
 *     requestBody:
 *       description: Raw Stripe event object.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: 'string' }
 *               type: { type: 'string' }
 *               data: { type: 'object' }
 *     responses:
 *       200:
 *         description: Event received and processed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received: { type: 'boolean', example: true }
 *       400:
 *         description: Missing signature or invalid signature.
 *       500:
 *         description: Internal server error.
 */
stripeWebhookRouter.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      res.status(400).send('Webhook Error: Missing signature');
      return;
    }

    let event: Stripe.Event;

    try {
      event = paymentService.constructEvent(req.body as Buffer, sig as string);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Webhook signature verification failed', { error: message });
      res.status(400).send(`Webhook Error: ${message}`);
      return;
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const orderId = paymentIntent.metadata.orderId;
          if (orderId) {
            await orderService.confirmOrder(orderId);
            logger.info('Payment succeeded and order confirmed', { orderId });
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const failedIntent = event.data.object as Stripe.PaymentIntent;
          const failedOrderId = failedIntent.metadata.orderId;
          if (failedOrderId) {
            await orderService.failOrder(failedOrderId, failedIntent.last_payment_error?.message);
            logger.info('Payment failed and order marked as failed', { failedOrderId });
          }
          break;
        }

        default:
          logger.info(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error processing webhook event', { error: message, type: event.type });
      res.status(500).send('Internal Server Error');
    }
  }
);

export { stripeWebhookRouter };
