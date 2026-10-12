import { z } from 'zod';

/**
 * Receipt email. Each phone gets a random handle; mail to `<handle>@<host>` reaches the API
 * Worker, which reads the receipt in it, keeps only what it read (sealed), and drops the email.
 * The phone fetches what is waiting, saves it, then acknowledges, and the server deletes it.
 */

/** Letters and digits that cannot be mistaken for each other when read aloud or typed. */
export const EMAIL_HANDLE_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
export const EMAIL_HANDLE_LENGTH = 10;
export const emailHandlePattern = /^[a-km-np-z2-9]{10}$/;

/** What a phone may hold at once and fetch in one go. */
export const EMAIL_CAPTURES_MAX_PENDING = 100;
export const EMAIL_CAPTURES_PAGE = 50;

export const emailCaptureIdPattern = /^[A-Za-z0-9_-]{16,64}$/;
const captureId = z.string().regex(emailCaptureIdPattern);

export const emailHandleResponseSchema = z.object({
  handle: z.string().regex(emailHandlePattern),
});
export type EmailHandleResponse = z.infer<typeof emailHandleResponseSchema>;

/** One receipt read from an email: what the phone saves, and nothing of the email itself. */
export const emailCaptureSchema = z.object({
  id: captureId,
  amount: z.number().int().positive(),
  /** Who was paid; empty when the email did not say. */
  merchant: z.string().max(120),
  /** When it was paid, ISO 8601 in UTC. */
  at: z.string().min(20).max(40),
  /** The address the receipt came from ("no-reply@grab.com"). */
  from: z.string().max(254).nullable(),
  bank: z.string().max(60).nullable(),
  code: z.string().max(40).nullable(),
});
export type EmailCapture = z.infer<typeof emailCaptureSchema>;

export const emailCapturesResponseSchema = z.object({
  captures: z.array(emailCaptureSchema).max(EMAIL_CAPTURES_PAGE),
});

export const ackEmailCapturesRequestSchema = z.object({
  ids: z.array(captureId).min(1).max(EMAIL_CAPTURES_PAGE),
});
export const ackEmailCapturesResponseSchema = z.object({
  removed: z.number().int().nonnegative(),
});

/** The host of an API base (`https://6pm.oddeggs.studio/api` → `6pm.oddeggs.studio`). */
export function hostOfApiBase(apiBase: string): string | null {
  return /^https?:\/\/([^/:?#]+)/i.exec(apiBase)?.[1]?.toLowerCase() ?? null;
}

/** The address a phone shows: `<handle>@<host>`. */
export function receiptEmailAddress(handle: string, host: string): string {
  return `${handle}@${host}`;
}

/**
 * The handle a delivery was sent to, from its envelope recipient: the local part, lower case,
 * with any `+tag` dropped. Null when it cannot be a handle.
 */
export function handleOfRecipient(recipient: string): string | null {
  const local = recipient.trim().toLowerCase().split('@')[0]?.split('+')[0] ?? '';
  return emailHandlePattern.test(local) ? local : null;
}
