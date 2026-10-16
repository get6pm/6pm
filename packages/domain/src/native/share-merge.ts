import { z } from 'zod';

import type { ReadReceipt } from '../capture/read-receipt';
import { foldWords } from '../capture/spoken-spend';
import { VND, type Currency } from '../money/currency';
import { decimalsOf, homeMinorOf, toDecimal } from './share-amount';

/**
 * What the server's closer look at a receipt photo answers (`POST /v1/receipts/read`). The amount
 * is in minor units: whole units for the currencies Travel mode writes without decimals (đồng,
 * yen, won, rupiah, riel, kip), cents for every other one. `at` is the local time as printed,
 * with no zone. A photo the server could not read is `{receipt: null}`.
 */
export const receiptLookSchema = z.object({
  receipt: z
    .object({
      amount: z.number().int().nonnegative(),
      currency: z.string().regex(/^[A-Z]{3}$/),
      merchant: z.string().nullable(),
      at: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
        .nullable(),
      sure: z.boolean(),
      /** The currency is printed on the receipt; absent from servers that do not say. */
      currencyPrinted: z.boolean().optional(),
    })
    .nullable(),
});
export type ReceiptLook = z.infer<typeof receiptLookSchema>;

/**
 * The server's name only when the photo's own text shows its first two words (accents and case
 * aside):
 * a model can invent a shop's name, and a name the receipt never printed is worse than none.
 */
function printedName(name: string, lines: readonly string[]): boolean {
  const words = foldWords(name)
    .trim()
    .split(' ')
    .filter((word) => word !== '');
  if (words.length === 0) return false;
  const text = foldWords(lines.join(' '));
  return text.includes(` ${words.slice(0, 2).join(' ')} `);
}

/** "2026-08-29T19:14:00" as the phone's local time. */
function localInstant(at: string): string | null {
  const [date = '', time = ''] = at.split('T');
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi, s] = time.split(':').map(Number);
  if ([y, mo, d, h, mi, s].some((n) => n === undefined || Number.isNaN(n))) return null;
  const instant = new Date(y as number, (mo as number) - 1, d, h, mi, s);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}

/**
 * The currency once the server has looked, and whether it was printed. A currency the server
 * read printed on the receipt wins; else the phone's printed one stays; else the server's sure
 * reading beats a phone that only guessed from the text, the trip or nothing, but not one that
 * knows where the photo was taken.
 */
function mergedCurrency(read: ReadReceipt | null, server: NonNullable<ReceiptLook['receipt']>) {
  const serverPrinted = server.sure && server.currencyPrinted !== false;
  if (serverPrinted) return { currency: server.currency, printed: true };
  if (read?.currencySure) return { currency: read.currency, printed: true };
  const fromPhoto = read?.currencyFrom === 'photo' && read.currency !== null;
  const takeServer = read?.currency == null || (server.sure && !fromPhoto);
  return {
    currency: takeServer ? server.currency : (read?.currency ?? server.currency),
    printed: false,
  };
}

/**
 * The phone's reading with the server's laid over it, field by field: the currency as
 * `mergedCurrency` decides; the server's amount where the phone was unsure, or where the server
 * is sure and they differ; its name replaces a name the phone only guessed, when the photo
 * printed it; its time fills in a time the phone could not read. A reading the server could not
 * make leaves the phone's as it was. A total in the home currency is the reading's amount.
 */
export function mergeLook(
  read: ReadReceipt | null,
  look: ReceiptLook,
  lines: readonly string[],
  home: Currency = VND,
): ReadReceipt | null {
  const server = look.receipt;
  if (!server) return read;
  const merged = mergedCurrency(read, server);
  const currency = merged.currency ?? server.currency;
  const serverValue = server.amount / 10 ** decimalsOf(server.currency);
  const serverPrinted =
    currency === server.currency ? toDecimal(serverValue, currency, home) : null;
  const takeTotal = serverPrinted !== null && (!read?.totalSure || server.sure);
  const printed = takeTotal ? serverPrinted : (read?.printed ?? null);
  const inHome = currency === home.code ? homeMinorOf(printed, home) : null;
  const named = server.merchant?.trim() ?? '';
  const takeName = named !== '' && !read?.payeeSure && printedName(named, lines);
  const at = read?.at ?? (server.at ? localInstant(server.at) : null);
  return {
    kind: read?.kind ?? 'shop',
    amount: inHome,
    foreign: currency !== home.code && printed !== null ? { currency, amount: printed } : null,
    currency,
    printed,
    currencySure: merged.printed,
    currencyFrom: merged.printed
      ? 'printed'
      : currency === read?.currency
        ? read.currencyFrom
        : 'text',
    totalSure: (read?.totalSure ?? false) || (takeTotal && server.sure),
    totalLine: takeTotal ? null : (read?.totalLine ?? null),
    payee: takeName ? named : (read?.payee ?? ''),
    payeeSure: takeName ? server.sure : (read?.payeeSure ?? false),
    at,
    code: read?.code ?? null,
    bank: read?.bank ?? null,
    memo: read?.memo ?? null,
  };
}
