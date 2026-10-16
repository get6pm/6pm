import type { Vnd } from '../money/format';
import type { Field, Row } from './bank-receipt';
import { foldWords } from './spoken-spend';
import { parseWalletAmount } from './wallet-amount';

/** An amount in đồng, as a receipt prints it ("-120,000 VND", "120.000 đ", "VND 120,000"). */
export function dongIn(text: string): Vnd | null {
  const read = parseWalletAmount(text);
  return read?.currency === 'VND' ? read.amount : null;
}

const PRINTED_AMOUNT =
  /([-−+])?\s*(?:vnd|₫)?\s*(?:\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?\s*(?:vnd|vnđ|đ|₫|d)?(?!\p{L})|\d+\s*(?:vnd|vnđ|đ|₫)(?!\p{L}))/giu;

/** Words that, last before an unsigned amount, make it the balance ("SD: 1,250,000VND"). */
const BALANCE_WORDS = ['so du', 'sd', 'sdc', 'balance', 'kha dung', 'available'];
/** Words that, last before an amount, make it the transaction ("GD: -45,000", "thay đổi 50,000"). */
const CHANGE_WORDS = [
  'gd',
  'ps',
  'phat sinh',
  'so tien',
  'thay doi',
  'bien dong so du',
  'giao dich',
  'amount',
  'debit',
  'ghi no',
  'thanh toan',
];

/** Where the last of `words` ends in folded text, and how long it is; -1 when none is there. */
function lastWord(folded: string, words: readonly string[]): [end: number, length: number] {
  let best: [number, number] = [-1, 0];
  for (const word of words) {
    const at = folded.lastIndexOf(` ${word} `);
    const end = at < 0 ? -1 : at + word.length + 1;
    if (end > best[0] || (end === best[0] && word.length > best[1])) best = [end, word.length];
  }
  return best;
}

/** True when the words before an amount name the account's balance rather than what moved. */
function readsAsBalance(lead: string): boolean {
  const folded = foldWords(lead);
  const [balanceEnd, balanceLength] = lastWord(folded, BALANCE_WORDS);
  const [changeEnd, changeLength] = lastWord(folded, CHANGE_WORDS);
  if (balanceEnd < 0) return false;
  return balanceEnd > changeEnd || (balanceEnd === changeEnd && balanceLength > changeLength);
}

interface Printed {
  readonly amount: Vnd;
  readonly debit: boolean;
  readonly height: number;
}

/** Each amount a row prints, leaving out the balance: one signed `-` always moved money. */
function printedIn(row: Row): Printed[] {
  const text = row.cells.join(' ');
  const found: Printed[] = [];
  let from = 0;
  for (const match of text.matchAll(PRINTED_AMOUNT)) {
    const lead = text.slice(from, match.index);
    from = match.index + match[0].length;
    const debit = match[1] === '-' || match[1] === '−';
    const amount = dongIn(match[0]);
    if (amount === null || (!debit && readsAsBalance(lead))) continue;
    found.push({ amount, debit, height: row.height });
  }
  return found;
}

/**
 * The amount for receipts that show it without a label: an amount signed `-` before any other,
 * then the one printed largest, then the first. A balance ("SD: 1,250,000", "Số dư cuối") never.
 */
export function heroAmount(rows: readonly Row[], rowFields: readonly (Field | null)[]): Vnd | null {
  const printed = rows.flatMap((row, i) =>
    rowFields[i] === null || rowFields[i] === 'amount' ? printedIn(row) : [],
  );
  const debits = printed.filter((p) => p.debit);
  const pool = debits.length > 0 ? debits : printed;
  let best: Printed | null = null;
  for (const p of pool) if (!best || p.height > best.height) best = p;
  return best?.amount ?? null;
}
