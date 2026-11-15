import mongoose from 'mongoose';
import { TicketTypeModel } from '../src/models/ticket-type.model';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.dev') });

async function list() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not found in environment');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const tickets = await TicketTypeModel.find({});
  console.log(`Found ${tickets.length} total ticket types`);

  for (const t of tickets) {
    console.log(`- ID: ${t._id}, Name: ${t.name}, EventID: ${t.eventId}, Price: ${t.price}`);
  }

  await mongoose.disconnect();
}

list().catch(err => {
  console.error('List failed:', err);
  process.exit(1);
});
