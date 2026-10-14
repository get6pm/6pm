import { z } from 'zod';

import { DECIMAL_PATTERN } from '../travel/fx';

/**
 * What the app and its extensions hand each other through the App Group. Extensions never open the
 * money database: they leave one inbox file per capture for the app to import, and read what the
 * app writes for them. Every file carries `v`; a reader drops a version it does not know. The
 * Swift side mirrors these as Codable types.
 */

const id = z.string().min(1);
const instant = z.string().min(20);
const vnd = z.number().int().nonnegative();
const version = z.literal(1);
const currencyCode = z.string().regex(/^[A-Z]{3}$/);
const decimal = z.string().regex(DECIMAL_PATTERN);

export const SURFACES_VERSION = 1;

/** The receipt behind a shared capture: what the bank printed, with every number taken out. */
export const inboxReceiptSchema = z.object({
  bank: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  namingLines: z.array(z.string()),
  /** False when the payee's name was a guess the user did not check; absent on older files. */
  payeeSure: z.boolean().optional(),
});

export const inboxSpendSchema = z.object({
  v: version,
  id: z.uuid(),
  kind: z.literal('spend'),
  source: z.enum(['shared', 'applePay', 'voice']),
  status: z.enum(['caught', 'kept']),
  at: instant,
  /** Null when the source gave no readable amount: the close asks for it. */
  amount: vnd.nullable(),
  merchant: z.string(),
  categoryId: id.nullable(),
  note: z.string().optional(),
  receipt: inboxReceiptSchema.optional(),
  /**
   * A spend in another currency, as printed: `amount` in its own units. With `rate` (đồng for one
   * unit) the item's `amount` is already in đồng at that rate; without one it is null and the
   * close asks for it.
   */
  foreign: z
    .object({ currency: currencyCode, amount: decimal, rate: decimal.optional() })
    .optional(),
});
export type InboxSpend = z.infer<typeof inboxSpendSchema>;

/** "Paid" tapped on the Live Activity of a payment that was waiting. */
export const inboxPaidSchema = z.object({
  v: version,
  id: z.uuid(),
  kind: z.literal('paid'),
  spendId: id,
  at: instant,
});
export type InboxPaid = z.infer<typeof inboxPaidSchema>;

export const inboxItemSchema = z.discriminatedUnion('kind', [inboxSpendSchema, inboxPaidSchema]);
export type InboxItem = z.infer<typeof inboxItemSchema>;

/** What the share extension and the shortcuts need to file a spend without the database. */
export const surfaceContextSchema = z.object({
  v: version,
  language: z.enum(['en', 'vi']),
  host: z.string().min(1),
  categories: z.array(
    z.object({
      id,
      name: z.string().min(1),
      icon: z.string().min(1),
      tile: z.string(),
      glyph: z.string(),
      countsDaily: z.boolean(),
    }),
  ),
  rules: z.array(z.object({ key: z.string().min(1), categoryId: id })),
  safeToday: z.number().int(),
  strings: z.record(z.string(), z.string()),
  /** The trip under way in Travel mode: its currency is the guess for a receipt that says none. */
  travel: z.object({ currency: currencyCode }).nullable().optional(),
  /** The last rates the app has, đồng for one unit, so a foreign receipt is priced as Travel is. */
  rates: z.array(z.object({ currency: currencyCode, rate: decimal })).optional(),
});
export type SurfaceContext = z.infer<typeof surfaceContextSchema>;

/** One stretch of time a widget shows, from `from` until the next entry. Text is preformatted. */
export const surfaceEntrySchema = z.object({
  from: instant,
  safeText: z.string(),
  safeShort: z.string(),
  tomorrowText: z.string(),
  pendingText: z.string(),
  ringFraction: z.number().min(0).max(1),
  list: z.array(
    z.object({
      name: z.string(),
      amountText: z.string(),
      icon: z.string(),
      hue: z.number(),
      pending: z.boolean(),
    }),
  ),
  moreText: z.string(),
});

/** What the widgets draw: every number and word decided by the app, in its language. */
export const surfaceSnapshotSchema = z.object({
  v: version,
  writtenAt: instant,
  maxLook: z.string().nullable(),
  serious: z.boolean(),
  entries: z.array(surfaceEntrySchema),
  palettes: z.array(z.object({ hour: z.number().int(), tokens: z.record(z.string(), z.string()) })),
  strings: z.record(z.string(), z.string()),
});
export type SurfaceSnapshot = z.infer<typeof surfaceSnapshotSchema>;

/** A currency the card's Edit state can switch to, with its rate when the app has one. */
export const shareCurrencySchema = z.object({
  code: currencyCode,
  /** "S$ · SGD", "₫ · VND". */
  label: z.string(),
  rate: decimal.nullable(),
});
export type ShareCurrency = z.infer<typeof shareCurrencySchema>;

/** The card the share extension shows for a receipt, as the domain bundle returns it to Swift. */
export const shareCardSchema = z.object({
  /** In đồng: as read, or a foreign amount at the app's rate. Null when unread or unpriced. */
  amount: vnd.nullable(),
  payee: z.string(),
  payeeSure: z.boolean(),
  at: instant,
  /** The receipt printed when it was paid; false when `at` is the time it was shared. */
  atRead: z.boolean(),
  code: z.string().nullable(),
  bank: z.string().nullable(),
  categoryId: id.nullable(),
  /** "120.000₫", or "S$68,80" for a receipt in another currency. */
  amountText: z.string(),
  safeAfterText: z.string().nullable(),
  /** The category's name in the app's language, for the Category row. */
  categoryName: z.string().nullable(),
  /** The When row: "Today · 16:40", "09/10 · 16:40". */
  whenText: z.string(),
  /** The receipt's lines with every number taken out, kept on the inbox item for naming. */
  namingLines: z.array(z.string()),
  /** A bank or wallet transfer, or a shop's bill. */
  kind: z.enum(['transfer', 'shop']),
  /** The receipt's currency; null when its amounts are not đồng and nothing says what they are. */
  currency: currencyCode.nullable(),
  currencySure: z.boolean(),
  totalSure: z.boolean(),
  /** The row of the receipt (in reading order) the total was read from. */
  totalLine: z.number().int().nonnegative().nullable(),
  /** The total as printed, in the receipt's own units ("68.8"). */
  printed: decimal.nullable(),
  /** A foreign total with the rate it was priced at, null when there is no rate yet. */
  foreign: z
    .object({ currency: currencyCode, amount: decimal, rate: decimal.nullable() })
    .nullable(),
  /** "1.747.000₫" under a foreign amount priced at a rate. */
  inDongText: z.string().nullable(),
  /** What the amount field opens with in Edit: "120.000", "68,80". */
  editText: z.string(),
  /** The amount is typed with decimals (a currency with cents). */
  decimalEntry: z.boolean(),
  /** Currencies Edit can switch between; empty when the receipt's own is certain. */
  currencies: z.array(shareCurrencySchema),
  /** The reading is unsure of the total or the currency, and the photo is worth a closer look. */
  needsCheck: z.boolean(),
});
export type ShareCard = z.infer<typeof shareCardSchema>;

/** What logging a spend from a shortcut returns: the inbox item and the snippet's lines. */
export const logSpendResultSchema = z.object({
  item: inboxSpendSchema.nullable(),
  /** Set when the amount could not be read and Siri should ask again. */
  needsAmount: z.boolean(),
  amountText: z.string(),
  title: z.string(),
  safeAfterText: z.string().nullable(),
});
export type LogSpendResult = z.infer<typeof logSpendResultSchema>;
