import {
  emailModelText,
  emailSpendOf,
  mayHoldPayment,
  parseReceiptEmail,
  VIETNAM_UTC_OFFSET_MINUTES,
  type EmailSpend,
  type ReceiptEmail,
} from '@6pm/domain';

import { readEmail } from '../ai/read-email';
import type { Bindings } from '../env';
import { ApiError } from '../errors';
import { aiCallsToday, recordAiUsage } from '../ledger';

/**
 * Model reads a free phone gets in a day. Real payments come to a handful; past this, mail is read
 * by the rules, so a flood of mail costs nothing and loses no receipt. The day starts at midnight
 * in Vietnam: an email carries no phone clock.
 */
export const EMAIL_MODEL_READS_PER_DAY = 50;
/** Max has no allowance; this only stops a forwarding loop from spending the model budget. */
export const EMAIL_MODEL_READS_PER_DAY_MAX = 1_000;
/** How long a phone's word that it has Max lasts; it says so again every time it fetches. */
export const EMAIL_MAX_WORD_MS = 3 * 24 * 60 * 60 * 1000;

/** Keeps what the phone said of its plan; a phone that says nothing (an older app) changes nothing. */
export async function rememberPlan(
  db: D1Database,
  deviceHash: string,
  plan: string | undefined,
  now: Date,
): Promise<void> {
  if (plan !== 'max' && plan !== 'free') return;
  const until = plan === 'max' ? new Date(now.getTime() + EMAIL_MAX_WORD_MS).toISOString() : null;
  await db
    .prepare('UPDATE email_handles SET max_until = ? WHERE device_hash = ?')
    .bind(until, deviceHash)
    .run();
}

/** The model reads a phone has in a day: Max's ceiling while its word lasts, else free's. */
async function readsPerDay(db: D1Database, deviceHash: string, now: Date): Promise<number> {
  const row = await db
    .prepare('SELECT max_until FROM email_handles WHERE device_hash = ?')
    .bind(deviceHash)
    .first<{ max_until: string | null }>();
  const max = row?.max_until != null && row.max_until > now.toISOString();
  return max ? EMAIL_MODEL_READS_PER_DAY_MAX : EMAIL_MODEL_READS_PER_DAY;
}

/**
 * The payment in one email, or null when it holds none. The model reads it when the Worker has a
 * key and the email prints an amount (`mayHoldPayment`; one that does not holds no payment and is
 * dropped unread), up to the phone's daily allowance (none for Max): it tells a payment from a transfer between
 * the person's own accounts, a promotion, a failed charge or an order update, and names who was really paid. When the model cannot answer, the
 * rules read it instead, so a receipt is never lost to an outage: the email is never kept to be
 * read again later. Only the token counts reach the cost ledger, and nothing from the email is
 * logged.
 */
export async function readSpend(
  email: ReceiptEmail,
  env: Pick<Bindings, 'ANTHROPIC_API_KEY' | 'DB'>,
  deviceHash: string,
  now: Date,
): Promise<EmailSpend | null> {
  const options = { receivedAt: now.toISOString() };
  if (!mayHoldPayment(email)) return null;
  const allowed =
    env.ANTHROPIC_API_KEY !== undefined &&
    env.ANTHROPIC_API_KEY !== '' &&
    (await aiCallsToday(env.DB, deviceHash, 'email.read', VIETNAM_UTC_OFFSET_MINUTES)) <
      (await readsPerDay(env.DB, deviceHash, now));
  if (allowed) {
    try {
      const read = await readEmail({ apiKey: env.ANTHROPIC_API_KEY }, emailModelText(email));
      await recordAiUsage(env.DB, {
        route: 'email.read',
        model: read.model,
        inputTokens: read.inputTokens,
        outputTokens: read.outputTokens,
        deviceHash,
      });
      return emailSpendOf(read.output, email, options);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      console.warn('receipt email: read by rules, the model did not answer', {
        reason: error.code,
      });
    }
  }
  const read = parseReceiptEmail(email, options);
  return read === null ? null : { ...read, currency: 'VND', category: null };
}
