/**
 * Which currency a shop receipt is in. A receipt from abroad must never become đồng by default:
 * its own marks decide first (S$, Rp, ฿, "(IDR)"), then what it says about where it was printed
 * (a city, "GST REG", a +62 phone, the language of its labels), then the trip Travel mode is on,
 * and only then đồng, unless its amounts carry cents, which đồng never does.
 */

export interface ReceiptCurrency {
  /** ISO 4217, or null when the amounts are clearly not đồng and nothing says what they are. */
  readonly currency: string | null;
  /** True only when the receipt printed the currency itself; false when it was inferred. */
  readonly sure: boolean;
}

/** Marks a receipt prints next to its amounts, by currency. Longer marks first. */
const MARKS: readonly (readonly [string, RegExp])[] = [
  ['VND', /\d\s?[đ₫](?!\p{L})|₫|(?<![a-z])vn[dđ](?![a-z])|(?<!\p{L})đồng(?!\p{L})/iu],
  ['SGD', /s\$|(?<![a-z])sgd(?![a-z])/i],
  ['USD', /us\$|(?<![a-z])usd(?![a-z])/i],
  ['AUD', /a\$|(?<![a-z])aud(?![a-z])/i],
  ['HKD', /hk\$|(?<![a-z])hkd(?![a-z])/i],
  ['TWD', /nt\$|(?<![a-z])twd(?![a-z])/i],
  ['IDR', /(?<![a-z])idr(?![a-z])|(?<![a-z])rp\.?\s?\d/i],
  ['MYR', /(?<![a-z])myr(?![a-z])|(?<![a-z])rm\s?\d/i],
  ['THB', /฿|(?<![a-z])thb(?![a-z])|บาท/i],
  ['CNY', /cn¥|(?<![a-z])(?:cny|rmb)(?![a-z])|元/i],
  ['JPY', /(?<!cn)¥|(?<![a-z])jpy(?![a-z])|円/i],
  ['KRW', /₩|(?<![a-z])krw(?![a-z])|원/i],
  ['EUR', /€|(?<![a-z])eur(?![a-z])/i],
  ['GBP', /£|(?<![a-z])gbp(?![a-z])/i],
  ['PHP', /₱/],
  ['KHR', /៛|(?<![a-z])khr(?![a-z])/i],
  ['LAK', /₭|(?<![a-z])lak(?![a-z])/i],
];

/** Where a receipt was printed, by the currency spent there: places, tax lines, phone codes. */
const PLACES: readonly (readonly [string, RegExp])[] = [
  [
    'VND',
    /việt nam|viet ?nam|\bhcmc?\b|tp\.? ?hcm|hồ chí minh|ho chi minh|hà nội|ha ?noi|đà nẵng|da nang|\(84\)|\+84|\bgtgt\b|hóa đơn|hoá đơn|\bquận\b|\bphường\b/iu,
  ],
  ['SGD', /singapore|gst reg|\+65\b/i],
  [
    'IDR',
    /indonesia|\bbali\b|jakarta|\bkuta\b|\bubud\b|nusa ?penida|lombok|surabaya|bandung|\+62/i,
  ],
  ['THB', /thailand|bangkok|phuket|chiang mai|pattaya|\+66\b|[฀-๿]/i],
  ['MYR', /malaysia|kuala lumpur|penang|\+60\b|\bsst\b/i],
  ['JPY', /japan|tokyo|osaka|kyoto|\+81\b|[぀-ヿ]/i],
  ['KRW', /korea|seoul|busan|\+82\b|[가-힯]/i],
  ['PHP', /philippines|manila|cebu|\+63\b/i],
  ['KHR', /cambodia|phnom penh|siem reap|\+855\b/i],
  ['LAK', /\blaos\b|vientiane|luang prabang|\+856\b/i],
  ['HKD', /hong kong|\+852\b/i],
  ['TWD', /taiwan|taipei|\+886\b/i],
  ['AUD', /australia|sydney|melbourne|\+61\b/i],
  ['GBP', /united kingdom|london|\+44\b/i],
  ['USD', /united states|\busa\b/i],
];

/** The language of a receipt's own labels, a weaker hint than a place. */
const VIETNAMESE = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/iu;
const WORDS: readonly (readonly [string, RegExp])[] = [
  ['IDR', /terima kasih|pembayaran|\bjumlah\b|\bharga\b|\bkasir\b|\btanggal\b|\bpajak\b|\bmeja\b/i],
  ['VND', VIETNAMESE],
];

const PLACE_WEIGHT = 2;
const WORD_WEIGHT = 1;

function tally(text: string, table: readonly (readonly [string, RegExp])[], weight: number) {
  const scores = new Map<string, number>();
  for (const [code, pattern] of table) {
    if (pattern.test(text)) scores.set(code, (scores.get(code) ?? 0) + weight);
  }
  return scores;
}

function best(scores: ReadonlyMap<string, number>): string | null {
  let top: string | null = null;
  let topScore = 0;
  for (const [code, score] of scores) {
    if (score > topScore) [top, topScore] = [code, score];
  }
  return top;
}

/** How many times each currency's mark is printed on the receipt. */
function countMarks(rows: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const [code, pattern] of MARKS) {
      if (pattern.test(row)) counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * The currency of a shop receipt from its rows in reading order. `centsPrinted` says the amounts
 * carry two decimals (68.80), which rules đồng out. `prior` is the trip's currency in Travel mode.
 */
export function readReceiptCurrency(
  rows: readonly string[],
  centsPrinted: boolean,
  prior: string | null,
): ReceiptCurrency {
  const marks = countMarks(rows);
  if (centsPrinted) marks.delete('VND');
  const marked = best(marks);
  if (marked !== null) return { currency: marked, sure: true };

  const text = rows.join('\n');
  const scores = tally(text, PLACES, PLACE_WEIGHT);
  for (const [code, score] of tally(text, WORDS, WORD_WEIGHT)) {
    scores.set(code, (scores.get(code) ?? 0) + score);
  }
  if (centsPrinted) scores.delete('VND');
  const placed = best(scores);
  // A receipt written in Vietnamese with nothing foreign on it is in đồng: its language is
  // printed as plainly as a mark would be.
  const vietnamese = placed === 'VND' && scores.size === 1 && VIETNAMESE.test(text);
  if (placed !== null) return { currency: placed, sure: vietnamese };
  if (prior !== null && (prior !== 'VND' || !centsPrinted)) return { currency: prior, sure: false };
  return { currency: centsPrinted ? null : 'VND', sure: false };
}
