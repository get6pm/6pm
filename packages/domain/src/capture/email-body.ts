import { foldWords } from './spoken-spend';

/** Combining marks for the accented-letter entities older bank templates still write. */
const ACCENTS: Readonly<Record<string, string>> = {
  grave: '\u0300',
  acute: '\u0301',
  circ: '\u0302',
  tilde: '\u0303',
  uml: '\u0308',
  breve: '\u0306',
  ring: '\u030a',
};

const ENTITIES: Readonly<Record<string, string>> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  dstrok: 'đ',
  Dstrok: 'Đ',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  hellip: '…',
  middot: '·',
  bull: '•',
  euro: '€',
};

function namedEntity(name: string): string | null {
  const fixed = ENTITIES[name];
  if (fixed !== undefined) return fixed;
  const accented = /^([a-zA-Z])(grave|acute|circ|tilde|uml|breve|ring)$/.exec(name);
  if (!accented?.[1] || !accented[2]) return null;
  return (accented[1] + (ACCENTS[accented[2]] ?? '')).normalize('NFC');
}

function codePoint(value: number): string | null {
  return Number.isInteger(value) && value > 0 && value <= 0x10ffff
    ? String.fromCodePoint(value)
    : null;
}

/** `&amp;`, `&#7871;`, `&#x1EBF;`, `&ecirc;`: anything unknown is left as written. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]{1,6}|#\d{1,7}|[a-z]{2,8});/gi, (whole, ref: string) => {
    if (ref.startsWith('#x') || ref.startsWith('#X')) {
      return codePoint(parseInt(ref.slice(2), 16)) ?? whole;
    }
    if (ref.startsWith('#')) return codePoint(Number(ref.slice(1))) ?? whole;
    return namedEntity(ref) ?? whole;
  });
}

/**
 * Plain text as lines: quote marks of a reply taken off, runs of spaces made one, a tab kept as
 * the break between a label and its value, blank lines dropped.
 */
export function textToLines(text: string): string[] {
  return text
    .normalize('NFC')
    .split(/\r?\n|\r/)
    .map((line) =>
      line
        .replace(/^(?:\s*>)+/, '')
        .replace(/[ \u00a0\u200b\f\v]+/g, ' ')
        .replace(/ *\t[\t ]*/g, '\t')
        .trim(),
    )
    .filter((line) => line !== '');
}

/**
 * An HTML email as lines of text. Table cells end in a tab, so "Số tiền | 120.000 VND" in two
 * cells reads as a label and its value; rows, paragraphs and breaks end a line.
 */
export function htmlToLines(html: string): string[] {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(head|style|script|title)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<\/(?:td|th)\s*>/gi, '\t')
    .replace(/<(?:br|hr)\b[^>]*>/gi, '\n')
    .replace(/<\/(?:p|div|tr|li|h[1-6]|table|blockquote|section|header|footer)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ');
  return textToLines(decodeEntities(text));
}

/** A sender as `Name <address>` or a bare address. */
export interface EmailSender {
  readonly name: string;
  readonly address: string;
}

/** "Grab <no-reply@grab.com>", "\"VCB\" <x@vcb.vn>", "x@vcb.vn". Null when no address is in it. */
export function readSender(value: string): EmailSender | null {
  const address = /<?([^\s<>"@]+@[^\s<>"@]+\.[a-z]{2,})>?/i.exec(value)?.[1];
  if (!address) return null;
  const name = value
    .replace(/<[^>]*>/, '')
    .replace(address, '')
    .replace(/["']/g, '')
    .trim();
  return { name, address: address.toLowerCase() };
}

/** The header block a forwarded email carries, read and taken out of the body. */
export interface ForwardedBody {
  readonly lines: string[];
  readonly from: EmailSender | null;
  /** The Date line as written ("Fri, Oct 9, 2026 at 4:40 PM"). */
  readonly date: string | null;
}

const FORWARD_MARKS = [
  ' forwarded message ',
  ' original message ',
  ' begin forwarded message ',
  ' chuyen tiep ',
];

const HEADER_LINE =
  /^(from|từ|người gửi|date|sent|ngày|đã gửi|vào|subject|chủ đề|tiêu đề|to|tới|đến|cc)\s*:\s*(.*)$/iu;
const FROM_KEYS = new Set(['from', 'tu', 'nguoi gui']);
const DATE_KEYS = new Set(['date', 'sent', 'ngay', 'da gui', 'vao']);

/**
 * Finds "---------- Forwarded message ---------" (in English or Vietnamese) and the From, Date,
 * Subject and To lines under it, so the receipt is read from the original sender and its own
 * date, and a forwarded "To: you@…" is never taken for who was paid.
 */
export function readForwarded(lines: readonly string[]): ForwardedBody {
  const mark = lines.findIndex((line) => {
    const folded = foldWords(line);
    return line.length < 80 && FORWARD_MARKS.some((m) => folded.includes(m));
  });
  if (mark < 0) return { lines: [...lines], from: null, date: null };
  let from: EmailSender | null = null;
  let date: string | null = null;
  let end = mark + 1;
  while (end < lines.length && end <= mark + 8) {
    const header = HEADER_LINE.exec(lines[end] ?? '');
    if (!header?.[1]) break;
    const key = foldWords(header[1]).trim();
    const value = (header[2] ?? '').trim();
    if (FROM_KEYS.has(key)) from = readSender(value);
    if (DATE_KEYS.has(key)) date = value;
    end += 1;
  }
  return { lines: [...lines.slice(0, mark), ...lines.slice(end)], from, date };
}
