import { z } from 'zod';

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(2000),
  locale: z.enum(['mk', 'en']).optional(),
  /** Honeypot — bots fill this; humans leave it empty. */
  website: z.string().max(200).optional(),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
