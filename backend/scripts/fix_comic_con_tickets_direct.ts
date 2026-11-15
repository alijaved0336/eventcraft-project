import mongoose from 'mongoose';
import { EventModel } from '../src/models/event.model';
import { TicketTypeModel } from '../src/models/ticket-type.model';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.dev') });

async function fix() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not found in environment');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const eventId = '69c46a7f28ea79837e42990e';
  // Use EventModel directly to avoid population issues
  const event = await EventModel.findById(eventId);
  
  if (!event) {
    console.error(`Event ${eventId} not found`);
    process.exit(1);
  }

  console.log(`Fixing event: ${event.title}`);
  
  const tiers = [
    {
      name: 'General Admission',
      price: 50,
      capacity: 1000,
      description: 'Access to all main stages'
    },
    {
      name: 'VIP Pass',
      price: 150,
      capacity: 100,
      description: 'Backstage access and exclusive lounge'
    }
  ];

  const ticketTypeIds: mongoose.Types.ObjectId[] = [];
  
  for (const tier of tiers) {
    const ticket = await TicketTypeModel.findOneAndUpdate(
      { eventId: event._id, name: tier.name },
      {
        $set: {
          name: tier.name,
          price: tier.price,
          capacity: tier.capacity,
          description: tier.description,
          currency: event.currency || 'USD',
          isActive: true
        }
      },
      { upsert: true, new: true }
    );
    
    if (ticket) {
      console.log(`  - Created/Updated ticket: ${tier.name} -> ${ticket._id}`);
      ticketTypeIds.push(ticket._id as mongoose.Types.ObjectId);
    }
  }

  // Update event document
  await EventModel.findByIdAndUpdate(eventId, {
    $set: { 
      ticketTiers: tiers, // Also update embedded tiers for consistency
      ticketTypes: ticketTypeIds 
    }
  });

  console.log('Fix complete');
  await mongoose.disconnect();
}

fix().catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});
