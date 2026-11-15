import { z } from 'zod';
import { UserRole } from '../lib/permissions';

export const RegisterInputSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  name: z.string().min(2, 'Name too short').max(100, 'Name too long').trim(),
  role: z
    .enum([
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.ORGANIZER,
      UserRole.HOST,
      UserRole.ATTENDEE,
      UserRole.GUEST,
    ])
    .default(UserRole.ORGANIZER),
  timezone: z.string().optional().default('UTC'),
});

export const LoginInputSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
