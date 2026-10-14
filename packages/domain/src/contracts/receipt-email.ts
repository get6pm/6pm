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

/**
 * The one mailbox each environment's host routes to its Worker. Email Routing has no catch-all on
 * a subdomain, so every phone shares it and is told apart by its handle after a `+`.
 */
export const RECEIPT_MAILBOX = 'receipts';

/** The address a phone shows: `receipts+<handle>@<host>`. */
export function receiptEmailAddress(handle: string, host: string): string {
  return `${RECEIPT_MAILBOX}+${handle}@${host}`;
}

/**
 * The handle a delivery was sent to, from its envelope recipient `receipts+<handle>@<host>`, lower
 * case. Null for any other mailbox, or when the tag cannot be a handle.
 */
export function handleOfRecipient(recipient: string): string | null {
  const local = recipient.trim().toLowerCase().split('@')[0] ?? '';
  const [mailbox, tag = ''] = local.split('+');
  return mailbox === RECEIPT_MAILBOX && emailHandlePattern.test(tag) ? tag : null;
}

/**
 * Forwarding checks. A mail service asked to forward to a 6pm address first sends that address a
 * code and a link, and forwards nothing until one of them is used. The Worker keeps what it read
 * from that email (sealed, one per phone, for a week) so the phone can show it.
 */
export const FORWARDING_PROVIDERS = ['gmail'] as const;
export type ForwardingProvider = (typeof FORWARDING_PROVIDERS)[number];
/** Each service by its own name, the same in every language. */
export const FORWARDING_PROVIDER_NAMES: Readonly<Record<ForwardingProvider, string>> = {
  gmail: 'Gmail',
};
export const FORWARDING_CHECK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Each provider's own confirm link and nothing else: https, its exact hosts, its confirm path (a
 * Gmail `vf-` link confirms; its `uf-` link cancels and is never taken), no query, no fragment, no
 * user, no port. Checked with a pattern, not `URL`, so the phone and the Worker agree exactly.
 */
const CONFIRM_URLS: Readonly<Record<ForwardingProvider, RegExp>> = {
  gmail:
    /^https:\/\/(?:mail-settings|mail|isolated\.mail)\.google\.com\/mail\/(?:u\/\d{1,2}\/)?vf-[A-Za-z0-9%_.~-]{8,900}$/,
};

export function isForwardingConfirmUrl(provider: ForwardingProvider, url: string): boolean {
  return CONFIRM_URLS[provider].test(url);
}

const emailAddress = z
  .string()
  .max(254)
  .regex(/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i);

/** What the phone shows of a forwarding check: never the email itself. */
export const forwardingCheckSchema = z
  .object({
    id: captureId,
    provider: z.enum(FORWARDING_PROVIDERS),
    /** The digits the provider asks for ("99427480"). */
    code: z.string().regex(/^\d{5,12}$/),
    /** The provider's confirm link, or null when the email had none that passed the check. */
    confirmUrl: z.string().max(1000).nullable(),
    /** The address that asked to forward ("lan@gmail.com"), when the email named it. */
    address: emailAddress.nullable(),
    /** When the email arrived, ISO 8601 in UTC. */
    receivedAt: z.string().min(20).max(40),
  })
  .refine(
    (check) =>
      check.confirmUrl === null || isForwardingConfirmUrl(check.provider, check.confirmUrl),
    {
      message: 'Not the provider’s confirm link',
      path: ['confirmUrl'],
    },
  );
export type ForwardingCheck = z.infer<typeof forwardingCheckSchema>;

export const forwardingCheckResponseSchema = z.object({
  check: forwardingCheckSchema.nullable(),
});

export const dismissForwardingCheckRequestSchema = z.object({ id: captureId });
export const dismissForwardingCheckResponseSchema = z.object({
  removed: z.number().int().nonnegative(),
});
