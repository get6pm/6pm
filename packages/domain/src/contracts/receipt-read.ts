import { z } from 'zod';

import { readPrintedNumber } from '../capture/wallet-amount';
import { TRAVEL_CURRENCIES } from '../travel/currencies';
import { languageSchema } from './wire';

/**
 * Reading a receipt photo on the server. The phone reads a shared receipt itself first; when it is
 * not sure of the total or the currency, it sends the photo here once to be read by a vision
 * model. The photo is never stored or logged, and offline the phone keeps its own reading.
 */

/** The largest photo accepted, decoded: the phone sends a JPEG no longer than 1600 px a side. */
export const RECEIPT_READ_MAX_IMAGE_BYTES = 1_572_864;
/** The same limit as base64 text: four characters for every three bytes. */
export const RECEIPT_READ_MAX_IMAGE_CHARS = Math.ceil(RECEIPT_READ_MAX_IMAGE_BYTES / 3) * 4;
/** The whole JSON body: the photo plus a language and a currency code. */
export const RECEIPT_READ_MAX_BODY_BYTES = RECEIPT_READ_MAX_IMAGE_CHARS + 1_024;

/** ISO 4217 alphabetic code, upper case. */
export const currencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);

/** Every JPEG starts with the bytes FF D8 FF, which base64 writes as `/9j/`. */
const jpegBase64 = z
  .string()
  .max(RECEIPT_READ_MAX_IMAGE_CHARS)
  .regex(/^\/9j\/[A-Za-z0-9+/]*={0,2}$/, { message: 'not a base64 JPEG' })
  .refine((text) => text.length % 4 === 0, { message: 'not a base64 JPEG' });

export const receiptReadRequestSchema = z.object({
  /** Base64 JPEG without a `data:` prefix. */
  image: jpegBase64,
  language: languageSchema,
  /** Travel mode's currency or the phone's guess; only a tie-breaker for the model. */
  currencyHint: currencyCodeSchema.nullable(),
});
export type ReceiptReadRequest = z.infer<typeof receiptReadRequestSchema>;

/** Local time as printed, without a zone: `2026-08-29T19:14:00`. */
const printedLocalTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);

export const receiptReadingSchema = z.object({
  /** Whole minor units of `currency`, as `receiptMinorUnits` counts them. */
  amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  currency: currencyCodeSchema,
  /** The shop's own name; null when the receipt does not say. */
  merchant: z.string().min(1).max(120).nullable(),
  at: printedLocalTime.nullable(),
  /** False when the total or the currency could not be read with confidence. */
  sure: z.boolean(),
});
export type ReceiptReading = z.infer<typeof receiptReadingSchema>;

/**
 * Null when the server has no reading to offer: the photo is not a receipt or payment
 * confirmation, its total is unreadable, or the model declined. The phone keeps its own reading.
 */
export const receiptReadResponseSchema = z.object({
  receipt: receiptReadingSchema.nullable(),
});
export type ReceiptReadResponse = z.infer<typeof receiptReadResponseSchema>;

/**
 * Decimals a currency's amounts are counted in. Đồng and the currencies Travel mode writes whole
 * (yen, won, riel, kip, rupiah) have none; every other currency has cents. For the currencies a
 * payment app prints this matches `parseWalletAmount`.
 */
export function receiptCurrencyDecimals(currency: string): 0 | 2 {
  if (currency === 'VND') return 0;
  return TRAVEL_CURRENCIES[currency]?.decimals ?? 2;
}

/**
 * A total as the receipt printed it ("101.500", "68.80", "1,250,000"), in whole minor units of
 * its currency. Null when it is not a readable positive amount.
 */
export function receiptMinorUnits(printed: string, currency: string): number | null {
  const digits = printed
    .normalize('NFC')
    .replace(/[^\d.,'\s]/g, '')
    .trim();
  if (digits === '') return null;
  const value = readPrintedNumber(digits);
  if (value === null || !Number.isFinite(value) || value <= 0) return null;
  const amount = Math.round(value * 10 ** receiptCurrencyDecimals(currency));
  return amount > 0 && Number.isSafeInteger(amount) ? amount : null;
}
