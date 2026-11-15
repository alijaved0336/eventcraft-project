import mongoose from 'mongoose';
import { OrderModel } from '../src/models/order.model';
import { TicketIssuanceModel } from '../src/models/ticket-issuance.model';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.dev') });

async function check() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not found in environment');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const orderId = '69c67ba3f6704e2660628077';
  const order = await OrderModel.findById(orderId);
  
  if (!order) {
    console.error(`Order ${orderId} not found`);
    process.exit(1);
  }

  console.log(`Order Status: ${order.status}`);
  console.log(`Pricing: ${JSON.stringify(order.pricing)}`);
  
  const tickets = await TicketIssuanceModel.find({ orderId });
  console.log(`Found ${tickets.length} tickets for this order`);

  for (const t of tickets) {
    console.log(`- Ticket ID: ${t._id}, Status: ${t.status}, QR: ${t.qrToken.substring(0, 10)}...`);
  }

  await mongoose.disconnect();
}

check().catch(err => {
  console.error('Check failed:', err);
  process.exit(1);
});
