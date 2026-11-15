import mongoose from 'mongoose';
import { EventModel } from '../src/models/event.model';
import { UserModel } from '../src/models/user.model'; // Register User schema
import { EventService } from '../src/services/event.service';
import { UserRole } from '../src/lib/permissions';
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
  const event = await EventModel.findById(eventId);
  
  if (!event) {
    console.error(`Event ${eventId} not found`);
    process.exit(1);
  }

  console.log(`Updating event: ${event.title}`);
  
  const updateData = {
    ticketTiers: [
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
    ]
  };

  // Use EventService.updateEvent to trigger logic
  const updated = await EventService.updateEvent(
    eventId,
    updateData as any,
    event.organizerId.toString(),
    UserRole.ORGANIZER
  );

  console.log('Update complete. Synced ticketTypes IDs:', updated.ticketTypes);
  
  await mongoose.disconnect();
}

fix().catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});
