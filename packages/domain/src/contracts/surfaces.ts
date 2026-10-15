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
/** In minor units of the home currency (đồng in Vietnam, cents in the US). */
const money = z.number().int().nonnegative();
const version = z.literal(1);
const currencyCode = z.string().regex(/^[A-Z]{3}$/);
const decimal = z.string().regex(DECIMAL_PATTERN);

/**
 * Fields added after a version shipped are optional, so either side reads the other's older files:
 * a context or an item without a home currency is in đồng.
 */
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
  /** Null when the source gave no readable amount, or none in the home currency yet. */
  amount: money.nullable(),
  /** The home currency `amount` is counted in; absent in files from before it was said (đồng). */
  currency: currencyCode.optional(),
  merchant: z.string(),
  categoryId: id.nullable(),
  note: z.string().optional(),
  receipt: inboxReceiptSchema.optional(),
  /**
   * A spend in another currency, as printed: `amount` in its own units. With `rate` (home units
   * for one unit) the item's `amount` is already in the home currency at that rate; without one
   * it is null and the app prices it when a rate arrives.
   */
  foreign: z
    .object({ currency: currencyCode, amount: decimal, rate: decimal.optional() })
    .optional(),
  /**
   * The receipt printed no currency and the one saved was guessed (from where the photo was
   * taken, the place it names, the trip, or the home currency by default); absent when it was printed, picked
   * by the user, or on older files.
   */
  currencyGuessed: z.boolean().optional(),
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
  /**
   * The last rates the app has, as the server quotes them (đồng for one unit), so a foreign
   * receipt is priced as Travel is. A home other than đồng is priced through its own quote.
   */
  rates: z.array(z.object({ currency: currencyCode, rate: decimal })).optional(),
  /** The home currency; absent (đồng) in a context written before it was kept. */
  currency: currencyCode.optional(),
  /** How the phone writes numbers, so the extensions write money as the app does. */
  numberStyle: z
    .object({
      languageTag: z.string().nullable().optional(),
      decimal: z.string().nullable().optional(),
      group: z.string().nullable().optional(),
    })
    .optional(),
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
  /** "155k spent", under the large widget's bar; absent in files from before it was drawn. */
  spentText: z.string().optional(),
  /** "of 400k": the day's line, beside `spentText`. */
  lineText: z.string().optional(),
  /** How much of the line is spent, 0 to 1: the bar's fill. */
  spentFraction: z.number().min(0).max(1).optional(),
  /** "40.000₫": what the spends past the list add up to, beside `moreText`. */
  moreAmountText: z.string().optional(),
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
  /** Home units for one unit; null for the home currency, or without a rate. */
  rate: decimal.nullable(),
});
export type ShareCurrency = z.infer<typeof shareCurrencySchema>;

/**
 * An amount in pieces for Swift to draw: the home currency's symbol on its own side ("$" before,
 * "₫" after), trimmed, so it can be set smaller. A foreign amount is all `number` ("S$68,80").
 */
export const amountPartsSchema = z.object({
  prefix: z.string(),
  number: z.string(),
  suffix: z.string(),
});
export type AmountParts = z.infer<typeof amountPartsSchema>;

/** The card the share extension shows for a receipt, as the domain bundle returns it to Swift. */
export const shareCardSchema = z.object({
  /** In the home currency: as read, or a foreign amount at the app's rate. Null when unread or unpriced. */
  amount: money.nullable(),
  /** The home currency the card was read for. */
  home: currencyCode,
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
  /** `amountText` in pieces. */
  amountParts: amountPartsSchema,
  safeAfterText: z.string().nullable(),
  /** The category's name in the app's language, for the Category row. */
  categoryName: z.string().nullable(),
  /** The When row: "Today · 16:40", "09/10 · 16:40". */
  whenText: z.string(),
  /** The receipt's lines with every number taken out, kept on the inbox item for naming. */
  namingLines: z.array(z.string()),
  /** A bank or wallet transfer, or a shop's bill. */
  kind: z.enum(['transfer', 'shop']),
  /** The receipt's currency; null when its amounts cannot be home's and nothing says what they are. */
  currency: currencyCode.nullable(),
  currencySure: z.boolean(),
  /** A shop receipt whose currency was not printed: the card offers it as a chip to switch. */
  currencyGuessed: z.boolean(),
  totalSure: z.boolean(),
  /** The row of the receipt (in reading order) the total was read from. */
  totalLine: z.number().int().nonnegative().nullable(),
  /** The total as printed, in the receipt's own units ("68.8"). */
  printed: decimal.nullable(),
  /** A foreign total with the rate it was priced at, null when there is no rate yet. */
  foreign: z
    .object({ currency: currencyCode, amount: decimal, rate: decimal.nullable() })
    .nullable(),
  /** "1.747.000₫" (the home currency) under a foreign amount priced at a rate. */
  inHomeText: z.string().nullable(),
  /** What the amount field opens with in Edit: "120.000", "68,80". */
  editText: z.string(),
  /** The amount is typed with decimals (a currency with cents). */
  decimalEntry: z.boolean(),
  /**
   * Currencies the card can switch between: when the currency is a guess, the guess, home and
   * the likely ones; else the one read, the trip's and home. Empty when the receipt's own is
   * certain.
   */
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
