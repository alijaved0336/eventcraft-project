import mongoose from 'mongoose';
import { EventModel } from '../src/models/event.model';
import { TicketTypeModel } from '../src/models/ticket-type.model';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.dev') });

async function sync() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not found in environment');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const events = await EventModel.find({ deletedAt: null });
  console.log(`Found ${events.length} events to sync`);

  for (const event of events) {
    console.log(`Syncing event: ${event.title} (${event.id})`);
    
    if (event.ticketTiers && event.ticketTiers.length > 0) {
      const ticketTypeIds: mongoose.Types.ObjectId[] = [];
      
      for (const tier of event.ticketTiers) {
        // Upsert by eventId and name
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
          console.log(`  - Synced ticket: ${tier.name} -> ${ticket._id}`);
          ticketTypeIds.push(ticket._id as mongoose.Types.ObjectId);
        }
      }
      
      // Update event with ticketType references
      await EventModel.findByIdAndUpdate(event._id, {
        $set: { ticketTypes: ticketTypeIds }
      });
      console.log(`  - Updated event with ${ticketTypeIds.length} ticketType references`);
    } else {
      console.log('  - No ticket tiers found for this event');
    }
  }

  console.log('Sync complete');
  await mongoose.disconnect();
}

sync().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
