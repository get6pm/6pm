import type { InboxSpend, ShareCard, SurfaceContext } from '../contracts/surfaces';
import type { ReceiptReadResponse } from '../contracts/receipt-read';
import type { Currency, Money } from '../money/currency';
import { contextMoney } from '../native/context-money';
import { buildShareCard, buildShareItem, cardOf } from '../native/share-card';
import { mergeLook } from '../native/share-merge';
import { receiptReadingOrder, type ReceiptLine } from './bank-receipt';
import { readReceipt } from './read-receipt';
import { splitPrinted, splitShare } from './receipt-split';

/**
 * A receipt scanned in the app is read exactly as one shared to 6pm: the same card from the
 * phone's lines, the same closer look laid over it, the same inbox item on Save. Only the edits
 * differ: Scan's keypad types an amount in the home currency.
 */
export type ScannedCard = ShareCard;

/** The card for the lines read on this iPhone. */
export function scannedReceiptCard(
  lines: readonly ReceiptLine[],
  context: SurfaceContext,
  now: Date,
): ScannedCard {
  return buildShareCard(lines, context, now);
}

/**
 * The card once the server has looked at the photo. Fields the phone read surely stay; a server
 * that could not read it leaves the phone's card. It no longer asks for a closer look either way.
 */
export function lookedReceiptCard(
  lines: readonly ReceiptLine[],
  look: ReceiptReadResponse,
  context: SurfaceContext,
  now: Date,
): ScannedCard {
  const home = contextMoney(context).home;
  const read = readReceipt(lines, context.travel?.currency ?? null, null, home.code);
  const merged = mergeLook(read, look, receiptReadingOrder(lines), home);
  return { ...cardOf(merged, lines, context, now), needsCheck: false };
}

/** What the user changed on Scan's card before Save. */
export interface ScannedEdits {
  /** Typed on the keypad, in the home currency's minor units; replaces what was read. */
  readonly amount?: Money;
  readonly payee?: string;
  readonly categoryId?: string;
  /** Split this many ways: only the user's share is saved, with `note` saying so. */
  readonly people?: number;
  readonly note?: string;
}

/**
 * The inbox item Save writes, as Share to 6pm's Confirm writes it; null while there is no amount.
 * An amount typed on the keypad is the home amount, and the foreign total it replaced is dropped.
 */
export function scannedReceiptItem(
  card: ScannedCard,
  edits: ScannedEdits,
  id: string,
  context: SurfaceContext,
): InboxSpend | null {
  const money = contextMoney(context);
  const typed = edits.amount !== undefined && edits.amount > 0 ? edits.amount : null;
  const base = typed === null ? card : { ...card, amount: typed, currency: money.home.code };
  const item = buildShareItem(
    base,
    {
      ...(edits.payee !== undefined ? { payee: edits.payee } : {}),
      ...(edits.categoryId !== undefined ? { categoryId: edits.categoryId } : {}),
      ...(typed === null ? {} : { currency: money.home.code }),
    },
    id,
    money,
  );
  if (item === null) return null;
  const read = typed === null ? item : dropForeign({ ...item, amount: typed });
  return split(read, edits, money.home);
}

/** A typed home amount replaces the foreign total it was typed over. */
function dropForeign(item: InboxSpend): InboxSpend {
  const { foreign: _replaced, currencyGuessed: _guess, ...kept } = item;
  return kept;
}

/** The user's share of a split receipt: the amount and the printed total, and the note. */
function split(item: InboxSpend, edits: ScannedEdits, home: Currency): InboxSpend {
  const people = edits.people ?? 1;
  if (people <= 1) return item;
  return {
    ...item,
    amount: item.amount === null ? null : splitShare(item.amount, people, home),
    ...(item.foreign
      ? { foreign: { ...item.foreign, amount: splitPrinted(item.foreign.amount, people) } }
      : {}),
    ...(edits.note ? { note: edits.note } : {}),
  };
}
