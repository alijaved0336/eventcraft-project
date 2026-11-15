import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { EventModel, EventType, EventStatus, EventVisibility } from './src/models/event.model';
import { UserModel } from './src/models/user.model';
import { TicketTypeModel } from './src/models/ticket-type.model';
import * as DailyService from './src/services/integrations/daily.service';
import { config } from './src/config';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/eventcraft');

    let organizer = await UserModel.findOne({ role: 'organizer' });
    if (!organizer) {
      console.log('No organizer found, creating a default one...');
      organizer = await UserModel.create({
        email: 'organizer@eventcraft.io',
        password: 'Password123!',
        name: 'EventCraft Global',
        role: 'organizer',
        isActive: true,
      });
    }

    console.log(`Using organizer: ${organizer.email} (${organizer._id})`);

    const imageDir = '/Users/codinngcops/.gemini/antigravity/brain/d880ccc4-0a9b-4926-a66f-acbadd213c6f';
    
    // 0. Cleanup existing dummy events
    console.log('Cleaning up existing Premium dummy events...');
    const existingEvents = await EventModel.find({ tags: 'Premium' });
    const eventIds = existingEvents.map(e => e._id);
    await EventModel.deleteMany({ _id: { $in: eventIds } });
    await TicketTypeModel.deleteMany({ eventId: { $in: eventIds } });

    const images = [
      { tag: 'Music', file: 'music_concert_cover_1775400853218.png' },
      { tag: 'Tech', file: 'tech_summit_cover_1775400883941.png' },
      { tag: 'Business', file: 'business_conference_cover_1775400916435.png' },
      { tag: 'Arts', file: 'arts_exhibition_cover_1775400932973.png' },
      { tag: 'Food & Drink', file: 'food_festival_cover_1775400950667.png' },
      { tag: 'Wellness', file: 'wellness_retreat_cover_1775400994660.png' },
      { tag: 'Workshops', file: 'diy_workshop_cover_1775401012074.png' },
    ];

    const eventsData = [
      {
        title: 'Neon Nights: Electronic Pulse Festival',
        description: 'Immerse yourself in a high-energy electronic music experience featuring world-class DJs and immersive light shows.',
        tag: 'Music',
        category: 'Music',
      },
      {
        title: 'FutureScape: Global Tech Summit 2026',
        description: 'The world\'s leading innovators gather to discuss VR, AI, and the next frontier of human-centric technology.',
        tag: 'Tech',
        category: 'Tech',
      },
      {
        title: 'Executive Horizons: Business Leadership Forum',
        description: 'A premium networking and strategy event for global enterprise leaders at the peak of their industries.',
        tag: 'Business',
        category: 'Business',
      },
      {
        title: 'Elements: Contemporary Abstract Exhibition',
        description: 'A curated journey through the most provocative abstract art pieces of the decade in a minimalist gallery setting.',
        tag: 'Arts',
        category: 'Arts',
      },
      {
        title: 'The Alchemist\'s Table: Gourmet Gastronomy',
        description: 'An exclusive culinary experience where science meets flavor in an incredible 7-course tasting menu.',
        tag: 'Food & Drink',
        category: 'Food & Drink',
      },
      {
        title: 'Minds in Motion: Alpine Wellness Retreat',
        description: 'Find your center among the majestic mountains. A week of guided meditation, yoga, and physical restoration.',
        tag: 'Wellness',
        category: 'Wellness',
      },
      {
        title: 'Craft & Create: The Master Woodworking Workshop',
        description: 'Learn the timeless art of artisan woodworking from master craftsmen in a hands-on collaborative environment.',
        tag: 'Workshops',
        category: 'Workshops',
      },
    ];

    console.log('Seeding events...');
    for (let i = 0; i < eventsData.length; i++) {
        const data = eventsData[i];
        const img = images.find(im => im.tag === data.tag);
        let bannerImage = '';
        
        if (img) {
            const imgPath = path.join(imageDir, img.file);
            if (fs.existsSync(imgPath)) {
                const buffer = fs.readFileSync(imgPath);
                bannerImage = `data:image/png;base64,${buffer.toString('base64')}`;
            }
        }

        const now = new Date();
        const startDate = new Date();
        if (i === 0) {
            // Make FIRST event (Music) LIVE now!
            startDate.setMinutes(now.getMinutes() - 15);
        } else {
            startDate.setDate(now.getDate() + (i + 1) * 7); // staggered future dates
        }

        let virtualSession = null;
        if (i < 2) {
            // Provision Daily rooms for FIRST TWO events (Music & Tech) for showcase
            console.log(`Provisioning Daily room for: ${data.title}...`);
            try {
                const roomName = `seed-${data.tag.toLowerCase()}-${Date.now().toString(36)}`;
                const room = await DailyService.createDailyRoom(roomName, { 
                    maxParticipants: 50, 
                    expiryHours: 72 
                });
                virtualSession = {
                    provider: 'daily',
                    roomName: room.name,
                    joinUrl: room.url,
                    hostUrl: room.url,
                    isLive: i === 0, // Set first one to live
                    peakAttendees: 0,
                    expiresAt: new Date(Date.now() + 72 * 3600 * 1000)
                };
            } catch (e) {
                console.warn(`Failed to provision room for ${data.title}:`, e);
            }
        }

        const event = new EventModel({
            title: data.title,
            description: data.description,
            type: EventType.HYBRID,
            status: EventStatus.PUBLISHED,
            visibility: EventVisibility.PUBLIC,
            organizerId: organizer._id,
            startDate,
            endDate: new Date(startDate.getTime() + 4 * 3600000), // 4 hours later
            timezone: 'UTC',
            location: {
                address: i % 2 === 0 ? '123 Event Lane' : '456 Virtual St',
                city: i % 2 === 0 ? 'San Francisco' : 'London',
                country: i % 2 === 0 ? 'USA' : 'UK',
            },
            category: data.category,
            tags: [data.tag, 'Premium', 'Featured'],
            bannerImage,
            capacity: 500,
            price: 99,
            currency: 'USD',
            isFree: false,
            virtualSession,
            ticketTiers: [
                { name: 'Early Bird', price: 79, capacity: 100, description: 'Limited time offer' },
                { name: 'General Admission', price: 99, capacity: 350, description: 'Standard entry' },
                { name: 'VIP Pass', price: 249, capacity: 50, description: 'Backstage access and refreshments' },
            ]
        });

        await event.save();
        
        // Create corresponding TicketTypes
        for (const tier of event.ticketTiers) {
            await TicketTypeModel.create({
                eventId: event._id,
                name: tier.name,
                description: tier.description,
                price: tier.price * 100, // in cents
                currency: 'USD',
                capacity: tier.capacity,
                sold: 0,
                reserved: 0,
                isActive: true
            });
        }

        console.log(`✓ Seeded: ${data.title}`);
    }

    console.log('Seeding complete! 🚀');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
