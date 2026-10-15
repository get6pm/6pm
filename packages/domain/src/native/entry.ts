import {
  shareCardSchema,
  surfaceContextSchema,
  type LogSpendResult,
  type ShareCard,
  type SurfaceContext,
} from '../contracts/surfaces';
import { receiptReadingOrder } from '../capture/bank-receipt';
import { currencyAt } from '../capture/photo-place';
import { readReceipt } from '../capture/read-receipt';
import { buildLogSpend } from './log-spend';
import { shareAmount } from './share-amount';
import {
  buildShareCard,
  buildShareItem,
  cardOf,
  receiptLinesSchema,
  shareEditsSchema,
  toReceiptLines,
} from './share-card';
import { mergeLook, receiptLookSchema } from './share-merge';
import { randomUuid } from './uuid';

/**
 * What the extensions' JavaScriptCore sees of the domain, bundled to `targets/_shared/
 * domain-native.js` as the global `SixpmDomain`. Every function takes strings (JSON where it says
 * so) and returns a JSON string, so Swift never does money maths and never formats a number
 * itself. None of them throws: bad input gives a well-formed answer with nothing read. Raise the
 * version when a function's input or output changes shape: the extension checks it before calling
 * anything.
 */
export const NATIVE_API_VERSION = 3;

function json(text: unknown): unknown {
  if (typeof text !== 'string') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function contextOf(contextJson: unknown): SurfaceContext | null {
  const parsed = surfaceContextSchema.safeParse(json(contextJson));
  return parsed.success ? parsed.data : null;
}

/** The instant Swift passed, or the JavaScript clock when it is missing or unreadable. */
function nowOf(nowIso: unknown): Date {
  const at = typeof nowIso === 'string' ? new Date(nowIso) : new Date(Number.NaN);
  return Number.isNaN(at.getTime()) ? new Date() : at;
}

/**
 * The currency where a photo was taken, from `{latitude, longitude}` as its own GPS recorded
 * them; null for "null", a photo without GPS, or anything unreadable.
 */
function locatedOf(placeJson: unknown): string | null {
  const place = json(placeJson);
  if (typeof place !== 'object' || place === null) return null;
  const { latitude, longitude } = place as { latitude?: unknown; longitude?: unknown };
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  return currencyAt(latitude, longitude);
}

function emptyCard(now: Date): ShareCard {
  return buildShareCard([], null, now);
}

/**
 * The share card for a receipt. `linesJson` is `[{text, box?: {x, y, w, h}, confidence?}]` (boxes
 * in Vision's normalised coordinates, origin bottom left; no boxes for a PDF's or a text's lines).
 * `placeJson` is where the photo was taken, `{latitude, longitude}` from its GPS, or "null".
 * Returns `ShareCard`.
 */
export function shareCard(
  linesJson: string,
  contextJson: string,
  nowIso: string,
  placeJson?: string,
): string {
  const now = nowOf(nowIso);
  try {
    const lines = receiptLinesSchema.safeParse(json(linesJson));
    const card = lines.success
      ? buildShareCard(
          toReceiptLines(lines.data),
          contextOf(contextJson),
          now,
          locatedOf(placeJson),
        )
      : emptyCard(now);
    return JSON.stringify(card);
  } catch {
    return JSON.stringify(emptyCard(now));
  }
}

/**
 * The card again once the server has looked at the photo: `lookJson` is the answer of
 * `POST /v1/receipts/read` (`{receipt: {amount, currency, merchant, at, sure} | null}`), and
 * `placeJson` the same as `shareCard`'s. Fields the phone read surely stay; anything unreadable
 * gives the phone's card unchanged. Returns `ShareCard`.
 */
export function shareLook(
  linesJson: string,
  lookJson: string,
  contextJson: string,
  nowIso: string,
  placeJson?: string,
): string {
  const now = nowOf(nowIso);
  try {
    const parsed = receiptLinesSchema.safeParse(json(linesJson));
    const lines = parsed.success ? toReceiptLines(parsed.data) : [];
    const context = contextOf(contextJson);
    const read = readReceipt(lines, context?.travel?.currency ?? null, locatedOf(placeJson));
    const look = receiptLookSchema.safeParse(json(lookJson));
    const merged = look.success ? mergeLook(read, look.data, receiptReadingOrder(lines)) : read;
    return JSON.stringify({ ...cardOf(merged, lines, context, now), needsCheck: false });
  } catch {
    return JSON.stringify(emptyCard(now));
  }
}

/**
 * What the card shows with the user's edits (`{amountText?, currency?}`): `{amount, amountText,
 * inDongText, decimalEntry, canConfirm}`. The amount is in đồng, null while a foreign amount has
 * no rate; Confirm works once there is an amount in some currency.
 */
export function shareShown(cardJson: string, editsJson: string): string {
  const nothing = {
    amount: null,
    amountText: '',
    inDongText: null,
    decimalEntry: false,
    canConfirm: false,
  };
  try {
    const card = shareCardSchema.safeParse(json(cardJson));
    const edits = shareEditsSchema.safeParse(json(editsJson) ?? {});
    if (!card.success) return JSON.stringify(nothing);
    const shown = shareAmount(card.data, edits.success ? edits.data : {});
    return JSON.stringify({
      amount: shown.amount,
      amountText: shown.amountText,
      inDongText: shown.inDongText,
      decimalEntry: shown.decimalEntry,
      canConfirm: shown.amount !== null || shown.foreign !== null,
    });
  } catch {
    return JSON.stringify(nothing);
  }
}

/**
 * The inbox item Confirm writes for a card (as `shareCard` returned it) and the user's edits
 * (`{amountText?, payee?, categoryId?, currency?}`, `{}` for none), with a fresh id. Returns `{item}`, the
 * item null while there is no amount.
 */
export function shareItem(cardJson: string, editsJson: string): string {
  try {
    const card = shareCardSchema.safeParse(json(cardJson));
    const edits = shareEditsSchema.safeParse(json(editsJson) ?? {});
    if (!card.success) return JSON.stringify({ item: null });
    const item = buildShareItem(card.data, edits.success ? edits.data : {}, randomUuid());
    return JSON.stringify({ item: item ?? null });
  } catch {
    return JSON.stringify({ item: null });
  }
}

/**
 * Logs a spend from the shortcut. `amountText` is Wallet's "Amount" or what was said to Siri;
 * `merchant` is Wallet's merchant, empty or null when Siri was asked. Returns `LogSpendResult`;
 * the item's id is a fresh lower-case UUID v4 made here.
 */
export function logSpend(
  amountText: string,
  merchant: string | null,
  contextJson: string,
  nowIso: string,
): string {
  const now = nowOf(nowIso);
  try {
    const said = typeof amountText === 'string' ? amountText : '';
    const where = typeof merchant === 'string' ? merchant : null;
    return JSON.stringify(buildLogSpend(said, where, contextOf(contextJson), now, randomUuid()));
  } catch {
    const nothing: LogSpendResult = {
      item: null,
      needsAmount: true,
      amountText: '',
      title: '',
      safeAfterText: null,
    };
    return JSON.stringify(nothing);
  }
}
