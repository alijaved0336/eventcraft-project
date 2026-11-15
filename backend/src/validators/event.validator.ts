import { z } from 'zod';
import { EventType, EventStatus, EventVisibility } from '../models/event.model';

const LocationInputSchema = z
  .union([
    z.string(),
    z.object({
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
    }),
  ])
  .optional();

const TicketTierInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required').trim(),
  price: z.number().min(0, 'Price cannot be negative'),
  capacity: z.number().int().min(0, 'Capacity cannot be negative'),
  description: z.string().optional(),
});

const EventInputShape = {
  title: z.string().min(2, 'Title is too short').max(200, 'Title is too long').trim(),
  description: z.string().optional(),
  type: z.nativeEnum(EventType).default(EventType.IN_PERSON),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
  visibility: z.nativeEnum(EventVisibility).default(EventVisibility.PRIVATE),

  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  timezone: z.string().default('UTC'), // In a real app, you might want a regex or list of valid IANA timezones

  location: LocationInputSchema,
  virtualLink: z.string().url().optional().or(z.string().length(0)),
  capacity: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().optional().default('USD'),
  category: z.string().optional(),
  bannerImage: z.string().optional(),
  gallery: z.array(z.string()).default([]),
  tags: z.array(z.string().trim()).default([]),

  isFree: z.boolean().default(false),
  registrationDeadline: z.coerce.date().optional(),
  ticketTiers: z.array(TicketTierInputSchema).default([]),

  workflowConfig: z.record(z.string(), z.unknown()).optional(),
};

export const CreateEventInputSchema = z.object(EventInputShape);

export const UpdateEventInputSchema = z.object(EventInputShape).partial();

export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventInputSchema>;
