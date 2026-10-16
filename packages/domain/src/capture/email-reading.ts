import { EMAIL_CATEGORY_IDS, type EmailCategoryId } from '../contracts/receipt-email';
import { currencyCodeSchema, receiptMinorUnits } from '../contracts/receipt-read';
import { cleanMemo } from './bank-receipt';
import {
  emailOrigin,
  emailPaidAt,
  type EmailReceipt,
  type ReceiptEmail,
  type ReceiptEmailOptions,
} from './receipt-email';

/**
 * Reading a receipt email with a model. The model says what kind of email it is and copies what a
 * payment prints; code decides the number: the amount is taken only when its text is printed in
 * the email, and is converted by `receiptMinorUnits`, never worked out by the model.
 */

/** What an email can be. Only a payment becomes a spend. */
export const EMAIL_KINDS = [
  'payment',
  'own_transfer',
  'refund',
  'incoming',
  'failed',
  'order_update',
  'promo',
  'otp',
  'statement',
  'other',
] as const;
export type EmailKind = (typeof EMAIL_KINDS)[number];

/** The model's reading of one email, as it answered. */
export interface EmailModelReading {
  readonly kind: EmailKind;
  /** The final amount paid, copied as printed ("₫607,790", "(VND) 700,000.00", "99 USD"). */
  readonly amount: string | null;
  /** ISO 4217 code of that amount. */
  readonly currency: string | null;
  readonly merchant: string | null;
  readonly category: string | null;
  /** When it was paid, as printed in local time: `YYYY-MM-DDTHH:MM:SS`. */
  readonly at: string | null;
  /** The order id or the bank's transaction reference, as printed. */
  readonly reference: string | null;
  /** The transfer's own words ("Nội dung"), as printed. */
  readonly note: string | null;
}

/** A spend read from an email with a model: in its own currency, with a category when it says. */
export interface EmailSpend extends Omit<EmailReceipt, 'amount'> {
  /** Whole minor units of `currency`. */
  readonly amount: number;
  readonly currency: string;
  readonly category: EmailCategoryId | null;
}

/** The most of an email's text the model reads; receipts say what matters well before this. */
export const EMAIL_MODEL_TEXT_MAX = 12_000;

/** The text the model reads: the sender, the date and the email's lines (subject first). */
export function emailModelText(email: ReceiptEmail): string {
  const origin = emailOrigin(email);
  const sender = origin.sender;
  const head = [
    `From: ${sender ? `${sender.name} <${sender.address}>`.trim() : '(unknown)'}`,
    `Date: ${origin.forwardedDate ?? email.date ?? '(unknown)'}`,
    '',
  ];
  return [...head, ...origin.lines].join('\n').slice(0, EMAIL_MODEL_TEXT_MAX);
}

const CURRENCY = '(?:₫|đ|vn[dđ]|us\\$|usd|\\$|idr|rp|eur|€|sgd|s\\$|thb|฿)';
/**
 * An amount as payments print one: a currency next to digits ("₫607,790", "(VND) 700,000.00",
 * "99 USD", "10,00 $ USD"), or digits grouped in thousands with no currency ("179.000", as MoMo
 * prints it).
 */
const PRINTED_MONEY = new RegExp(
  `${CURRENCY}\\)?\\s?\\(?\\s?\\d|\\d[\\d.,]*\\s?${CURRENCY}(?![a-z])|(?<![\\d.,])\\d{1,3}(?:[.,]\\d{3})+(?!\\d)`,
  'iu',
);

/**
 * Whether an email's subject or body prints anything that could be an amount paid. One that does
 * not (an alert, a sign-in code, a newsletter) holds no payment, and is never sent to the model.
 */
export function mayHoldPayment(email: ReceiptEmail): boolean {
  return emailOrigin(email).lines.some((line) => PRINTED_MONEY.test(line));
}

const squash = (text: string) => text.normalize('NFC').replace(/\s+/g, '');
const printedLocalTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const isCategory = (id: string): id is EmailCategoryId =>
  (EMAIL_CATEGORY_IDS as readonly string[]).includes(id);

/**
 * The spend a model's reading describes, or null when it is not a payment out or its amount
 * cannot be trusted: not printed in the email, no currency, or not a positive amount.
 */
export function emailSpendOf(
  reading: EmailModelReading,
  email: ReceiptEmail,
  options: ReceiptEmailOptions,
): EmailSpend | null {
  if (reading.kind !== 'payment' || reading.amount === null) return null;
  const currency = currencyCodeSchema.safeParse(reading.currency?.trim().toUpperCase());
  if (!currency.success) return null;
  const origin = emailOrigin(email);
  const printed = squash(reading.amount);
  if (printed === '' || !squash(origin.lines.join('\n')).includes(printed)) return null;
  const amount = receiptMinorUnits(reading.amount, currency.data);
  if (amount === null || amount <= 0) return null;

  const at = reading.at?.trim() ?? '';
  const category = reading.category?.trim().toLowerCase() ?? '';
  return {
    amount,
    currency: currency.data,
    category: isCategory(category) ? category : null,
    merchant: reading.merchant?.trim().slice(0, 120) ?? '',
    at: emailPaidAt(
      printedLocalTime.test(at) && !Number.isNaN(Date.parse(at)) ? at : null,
      origin,
      email,
      options,
    ),
    from: origin.sender?.address ?? null,
    bank: origin.bank,
    code: reading.reference?.trim().slice(0, 40) || null,
    memo: cleanMemo(reading.note),
  };
}
