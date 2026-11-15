import mongoose from 'mongoose';
import { OrderModel } from '../src/models/order.model';
import { TicketIssuanceRepository } from '../src/repositories/ticket-issuance.repository';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.dev') });

async function verify() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not found');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const orderId = '69c67ba3f6704e2660628077'; // Known confirmed order from previous step
  const order = await OrderModel.findById(orderId);
  
  if (!order) {
    console.log('Order not found');
    process.exit(1);
  }

  console.log(`Order found: ${order._id}, Status: ${order.status}`);

  const repo = new TicketIssuanceRepository();
  const tickets = await repo.findByOrder(orderId);

  console.log(`Found ${tickets.length} tickets for this order`);
  for (const t of tickets) {
    console.log(`- Ticket: ${t.ticketNumber}, Attendee: ${t.attendeeName} (${t.attendeeEmail}), Title: ${t.jobTitle}`);
  }

  await mongoose.disconnect();
}

verify().catch(console.error);
