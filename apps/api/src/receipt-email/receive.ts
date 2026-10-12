import {
  EMAIL_CAPTURES_MAX_PENDING,
  emailCaptureSchema,
  handleOfRecipient,
  parseReceiptEmail,
  type ReceiptEmail,
} from '@6pm/domain';
import PostalMime from 'postal-mime';

import type { Bindings } from '../env';
import { deviceOfHandle } from './handles';
import { sealCapture, sealKeyOf } from './seal';

/** A receipt is a few kilobytes; anything near this is mostly pictures and is turned away. */
export const EMAIL_MAX_BYTES = 1024 * 1024;
/** A receipt no phone has fetched in this long is deleted unread. */
export const EMAIL_CAPTURE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** The parts of an Email Routing message the handler uses, so tests can hand one in. */
export type InboundEmail = Pick<ForwardableEmailMessage, 'to' | 'raw' | 'rawSize' | 'setReject'>;

/** What became of one email, for tests and the log; never anything from the email itself. */
export type ReceiveOutcome =
  | 'unknown_address'
  | 'too_large'
  | 'rate_limited'
  | 'not_configured'
  | 'unreadable'
  | 'not_a_receipt'
  | 'full'
  | 'stored';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

/**
 * The capture's id: from the device and the email's Message-ID when it has one, so the same
 * email sent twice is one receipt (here, and on the phone after it was fetched).
 */
async function captureIdOf(deviceHash: string, messageId: string | undefined): Promise<string> {
  const seed = messageId?.trim() ? messageId.trim() : crypto.randomUUID();
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${deviceHash}\n${seed}`),
  );
  return toBase64Url(new Uint8Array(digest)).slice(0, 32);
}

function instantOrNull(value: string | undefined): string | null {
  const ms = value ? Date.parse(value) : NaN;
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

/**
 * Takes one email sent to `<handle>@<host>`. Mail to an address no phone holds, or larger than a
 * receipt can be, is refused (the sender gets a bounce). Mail to a real handle is read in memory:
 * when it holds a payment, only what was read is kept, sealed, for the phone to fetch; the email
 * itself is never stored or forwarded, and nothing from it is logged. Anything that is not a
 * receipt is dropped without a bounce, so a forwarding filter is never turned off by one.
 */
export async function receiveEmail(
  message: InboundEmail,
  env: Bindings,
  now = new Date(),
): Promise<ReceiveOutcome> {
  const unknown = (): ReceiveOutcome => {
    message.setReject('No such 6pm address');
    return 'unknown_address';
  };
  const handle = handleOfRecipient(message.to);
  if (handle === null) return unknown();
  if (message.rawSize > EMAIL_MAX_BYTES) {
    message.setReject('Message too large for a receipt');
    return 'too_large';
  }
  const deviceHash = await deviceOfHandle(env.DB, handle);
  if (deviceHash === null) return unknown();
  const { success } = await env.EMAIL_RATE_LIMIT.limit({ key: handle });
  if (!success) {
    message.setReject('Too many messages to this address, try again later');
    return 'rate_limited';
  }
  const secret = sealKeyOf(env);
  if (secret === null) {
    console.error('receipt email: EMAIL_SEAL_KEY is not set, refusing mail');
    message.setReject('This address is not taking mail right now');
    return 'not_configured';
  }

  let email: ReceiptEmail;
  let messageId: string | undefined;
  try {
    const parsed = await PostalMime.parse(message.raw, { maxNestingDepth: 20 });
    const from = parsed.from?.address
      ? { name: parsed.from.name, address: parsed.from.address }
      : null;
    email = {
      from,
      subject: parsed.subject ?? '',
      date: instantOrNull(parsed.date),
      text: parsed.text ?? null,
      html: parsed.html ?? null,
    };
    messageId = parsed.messageId;
  } catch {
    console.error('receipt email: a message could not be decoded');
    return 'unreadable';
  }

  const read = parseReceiptEmail(email, { receivedAt: now.toISOString() });
  if (read === null) return 'not_a_receipt';
  const capture = emailCaptureSchema.safeParse({
    id: await captureIdOf(deviceHash, messageId),
    amount: read.amount,
    merchant: read.merchant.slice(0, 120),
    at: read.at,
    from: read.from?.slice(0, 254) ?? null,
    bank: read.bank?.slice(0, 60) ?? null,
    code: read.code?.slice(0, 40) ?? null,
  });
  if (!capture.success) return 'not_a_receipt';

  const waiting = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM email_captures WHERE device_hash = ?',
  )
    .bind(deviceHash)
    .first<{ n: number }>();
  if ((waiting?.n ?? 0) >= EMAIL_CAPTURES_MAX_PENDING) return 'full';

  const sealed = await sealCapture(secret, deviceHash, capture.data);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM email_captures WHERE received_at < ?').bind(
      new Date(now.getTime() - EMAIL_CAPTURE_TTL_MS).toISOString(),
    ),
    env.DB.prepare(
      'INSERT OR IGNORE INTO email_captures (id, device_hash, sealed, received_at) VALUES (?, ?, ?, ?)',
    ).bind(capture.data.id, deviceHash, sealed, now.toISOString()),
  ]);
  return 'stored';
}
