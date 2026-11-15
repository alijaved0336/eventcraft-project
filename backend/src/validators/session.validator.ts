import { z } from 'zod';
import { SessionType } from '../models/session.model';
import mongoose from 'mongoose';

const SessionInputShape = {
  title: z.string().min(2, 'Title is too short').max(200, 'Title is too long').trim(),
  description: z.string().optional(),
  day: z.number().min(1, 'Day must be at least 1'),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.string().optional(),
  speakerIds: z
    .array(z.string().refine((id) => mongoose.isValidObjectId(id), 'Invalid speaker ID'))
    .default([]),
  track: z.string().optional(),
  order: z.number().min(0),
  type: z.nativeEnum(SessionType).default(SessionType.SESSION),
};

export const CreateSessionInputSchema = z
  .object({
    ...SessionInputShape,
    eventId: z.string().refine((id) => mongoose.isValidObjectId(id), 'Invalid event ID'),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export const UpdateSessionInputSchema = z
  .object(SessionInputShape)
  .partial()
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    { message: 'End time must be after start time', path: ['endTime'] },
  );

export type CreateSessionInput = z.infer<typeof CreateSessionInputSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionInputSchema>;
