import { z } from 'zod';

import { languageSchema } from './wire';

/** The largest monthly leak the list accepts, in đồng: far above anything the calculator reaches. */
export const waitlistLeakMax = 1_000_000_000;

/**
 * One signup from the Coming Soon page. The email is trimmed and lowercased here, so one inbox is
 * one place in line however it is typed. `leak` is the visitor's own monthly leak from the
 * calculator, in đồng, sent only when they worked it out.
 */
export const waitlistRequestSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  language: languageSchema,
  leak: z.number().int().nonnegative().max(waitlistLeakMax).optional(),
});
export type WaitlistRequest = z.input<typeof waitlistRequestSchema>;

/** The signup's place in line: 1 for the first email, then one more for each new one. */
export const waitlistResponseSchema = z.object({
  ticket: z.number().int().positive(),
});
export type WaitlistResponse = z.infer<typeof waitlistResponseSchema>;
