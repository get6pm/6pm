import { parseAmount } from '../money/parse-amount';
import {
  shareCardSchema,
  surfaceContextSchema,
  type LogSpendResult,
  type ShareCard,
  type SurfaceContext,
} from '../contracts/surfaces';
import { amountText } from './file-category';
import { buildLogSpend } from './log-spend';
import {
  buildShareCard,
  buildShareItem,
  receiptLinesSchema,
  shareEditsSchema,
  toReceiptLines,
} from './share-card';
import { randomUuid } from './uuid';

/**
 * What the extensions' JavaScriptCore sees of the domain, bundled to `targets/_shared/
 * domain-native.js` as the global `SixpmDomain`. Every function takes strings (JSON where it says
 * so) and returns a JSON string, so Swift never does money maths and never formats a number
 * itself. None of them throws: bad input gives a well-formed answer with nothing read. Raise the
 * version when a function's input or output changes shape: the extension checks it before calling
 * anything.
 */
export const NATIVE_API_VERSION = 1;

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

function emptyCard(now: Date): ShareCard {
  return buildShareCard([], null, now);
}

/**
 * The share card for a receipt. `linesJson` is `[{text, box?: {x, y, w, h}, confidence?}]` (boxes
 * in Vision's normalised coordinates, origin bottom left; no boxes for a PDF's or a text's lines).
 * Returns `ShareCard`.
 */
export function shareCard(linesJson: string, contextJson: string, nowIso: string): string {
  const now = nowOf(nowIso);
  try {
    const lines = receiptLinesSchema.safeParse(json(linesJson));
    const card = lines.success
      ? buildShareCard(toReceiptLines(lines.data), contextOf(contextJson), now)
      : emptyCard(now);
    return JSON.stringify(card);
  } catch {
    return JSON.stringify(emptyCard(now));
  }
}

/**
 * The inbox item Confirm writes for a card (as `shareCard` returned it) and the user's edits
 * (`{amountText?, payee?, categoryId?}`, `{}` for none), with a fresh id. Returns `{item}`, the
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

/**
 * An amount typed on the card's Edit state, read as Quick add reads one ("45" is 45.000₫).
 * Returns `{amount, amountText}`, both empty when nothing reads as an amount.
 */
export function readAmount(text: string): string {
  try {
    const amount = typeof text === 'string' ? parseAmount(text) : null;
    const usable = amount !== null && amount > 0 ? amount : null;
    return JSON.stringify({ amount: usable, amountText: amountText(usable) });
  } catch {
    return JSON.stringify({ amount: null, amountText: '' });
  }
}
