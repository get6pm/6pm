import type { Vnd } from '../money/format';
import { BANKS } from '../vietqr/bank-catalogue';
import { cleanMemo, parseBankReceipt, readReceiptTime } from './bank-receipt';
import { htmlToLines, readForwarded, textToLines, type EmailSender } from './email-body';
import { foldWords } from './spoken-spend';

/** Vietnamese banks and shops print their local time, UTC+7. */
export const VIETNAM_UTC_OFFSET_MINUTES = 7 * 60;

/** An email as the mail parser hands it over: decoded, nothing else of it is kept. */
export interface ReceiptEmail {
  readonly from: EmailSender | null;
  readonly subject: string;
  /** The Date header as an instant (ISO 8601), when it had one. */
  readonly date: string | null;
  readonly text: string | null;
  readonly html: string | null;
}

/** A spend read from a receipt email. */
export interface EmailReceipt {
  readonly amount: Vnd;
  /** Who was paid: the shop that sent it, else the payee the receipt names; empty when neither. */
  readonly merchant: string;
  /** When it was paid, ISO 8601 in UTC. */
  readonly at: string;
  /** The address the receipt came from: the original sender of a forwarded email. */
  readonly from: string | null;
  readonly bank: string | null;
  readonly code: string | null;
  /** The transfer's own words ("Nội dung: Thanh toan the tin dung"); null when it printed none. */
  readonly memo: string | null;
}

export interface ReceiptEmailOptions {
  /** When the email arrived, ISO 8601: the time of a receipt that prints none. */
  readonly receivedAt: string;
  /** The zone the receipt's printed time is in. Vietnam unless said otherwise. */
  readonly utcOffsetMinutes?: number;
}

/** Shops whose e-receipts 6pm reads, by a word of their sending domain. */
const SHOPS: Readonly<Record<string, string>> = {
  grab: 'Grab',
  be: 'Be',
  shopee: 'Shopee',
  shopeefood: 'ShopeeFood',
  xanhsm: 'Xanh SM',
  gojek: 'Gojek',
  tiki: 'Tiki',
  lazada: 'Lazada',
  baemin: 'Baemin',
};

const BANK_BY_WORD = new Map<string, string>(
  BANKS.flatMap((bank) => {
    const words = [foldWords(bank.shortName).replace(/ /g, '')];
    if (bank.id.length >= 3) words.push(bank.id.toLowerCase());
    return words.map((word) => [word, bank.shortName] as const);
  }),
);

/** The words of an address's domain, without the endings every domain has. */
function domainWords(address: string): string[] {
  const domain = address.split('@')[1] ?? '';
  return domain.split('.').filter((w) => !['com', 'vn', 'net', 'org', 'info'].includes(w));
}

function shopOf(sender: EmailSender | null): string | null {
  if (!sender) return null;
  for (const word of domainWords(sender.address)) {
    const shop = SHOPS[word];
    if (shop) return shop;
  }
  return null;
}

function bankOf(sender: EmailSender | null): string | null {
  if (!sender) return null;
  for (const word of domainWords(sender.address)) {
    const bank = BANK_BY_WORD.get(word.replace(/[^a-z0-9]/g, ''));
    if (bank) return bank;
  }
  return null;
}

/** Totals as shops print them, read as the receipt's amount. */
const TOTAL_LABELS = new Set([
  'total',
  'grand total',
  'total paid',
  'total amount',
  'amount paid',
  'you paid',
  'tong cong',
  'tong thanh toan',
  'tong so tien',
  'thanh tien',
  'ban da thanh toan',
  'da thanh toan',
]);

const LABEL_AND_VALUE =
  /^(.{2,40}?)\s*(?::|\t|\s{2,}|\s(?=[-–]?\s?(?:vnd|vnđ|₫|đ)?\s?\d))\s*(.+)$/iu;

/** "Total ₫38,000" → "Số tiền: ₫38,000"; a total's label alone on its line → "Số tiền". */
function withTotalsAsAmount(line: string): string {
  if (TOTAL_LABELS.has(foldWords(line).trim())) return 'Số tiền';
  const split = LABEL_AND_VALUE.exec(line);
  if (
    split?.[1] &&
    split[2] &&
    /\d/.test(split[2]) &&
    TOTAL_LABELS.has(foldWords(split[1]).trim())
  ) {
    return `Số tiền: ${split[2]}`;
  }
  return line;
}

const SIGNED_AMOUNT = /(?:^|[\s:|(])([+-])\s?(?:vnd\s?)?\d{1,3}(?:[.,]\d{3})+/giu;

/** Money that came in: a balance change only ever signed `+`, or a credit with no debit. */
function isIncoming(lines: readonly string[]): boolean {
  const text = lines.join('\n');
  const signs = new Set([...text.matchAll(SIGNED_AMOUNT)].map((m) => m[1]));
  if (signs.has('+') && !signs.has('-')) return true;
  const folded = foldWords(text);
  const credit = [' ghi co ', ' bao co ', ' credited ', ' you received ', ' ban da nhan '];
  const debit = [' ghi no ', ' bao no ', ' debited '];
  return credit.some((w) => folded.includes(w)) && !debit.some((w) => folded.includes(w));
}

const NOTE_LINE =
  /^(?:nội dung|noi dung|nd|description|details|diễn giải|dien giai)\s*[:\t]\s*(.+)$/iu;
const PAID_AT = /(?:^|\s)(?:tại|tai|at|tới|toi|to)\s+([^\d]+?)\s*(?:[-–.,;]|\d|$)/iu;

/** The transfer's words on a "Nội dung:" line, as the receipt printed them. */
function noteIn(lines: readonly string[]): string | null {
  for (const line of lines) {
    const note = cleanMemo(NOTE_LINE.exec(line)?.[1]);
    if (note !== null) return note;
  }
  return null;
}

/** "Nội dung: Thanh toan QR tai HIGHLANDS COFFEE" → "HIGHLANDS COFFEE", for a payee no label names. */
function payeeInNote(lines: readonly string[]): string {
  for (const line of lines) {
    const note = NOTE_LINE.exec(line)?.[1];
    const payee = note ? PAID_AT.exec(note)?.[1]?.trim() : undefined;
    if (payee && /\p{L}{2}/u.test(payee)) return payee;
  }
  return '';
}

/** A time read as this runtime's local wall clock, moved to the zone the receipt printed it in. */
function inZone(localIso: string, utcOffsetMinutes: number): string {
  const d = new Date(localIso);
  const wall = Date.UTC(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
  );
  return new Date(wall - utcOffsetMinutes * 60_000).toISOString();
}

/** A forwarded Date line in Gmail's or Outlook's words, as `readReceiptTime` reads dates. */
function forwardedTime(value: string | null): string | null {
  if (!value) return null;
  const plain = value
    .replace(/\b([a-z]{3})[a-z]*\.? (\d{1,2}),? (\d{4})/i, '$2 $1 $3')
    .replace(/(\d{1,2}) thg (\d{1,2}),? (\d{4})/i, '$1/$2/$3')
    .replace(/ at | lúc /gi, ' ');
  return readReceiptTime(plain);
}

/** Where an email came from: its body lines, the original sender of a forwarded one, its date. */
export interface EmailOrigin {
  /** The subject, then the body with any forwarded header taken out. */
  readonly lines: readonly string[];
  readonly sender: EmailSender | null;
  /** The bank the sender is, from its domain. */
  readonly bank: string | null;
  /** The forwarded email's own Date line, as printed. */
  readonly forwardedDate: string | null;
}

export function emailOrigin(email: ReceiptEmail): EmailOrigin {
  const body = email.html ? htmlToLines(email.html) : textToLines(email.text ?? '');
  const forwarded = readForwarded(body);
  const subject = email.subject.replace(/^(?:\s*(?:fwd?|tr|chuyển tiếp)\s*:)+/iu, '').trim();
  const sender = forwarded.from ?? email.from;
  return {
    lines: [subject, ...forwarded.lines].filter((l) => l !== ''),
    sender,
    bank: bankOf(sender),
    forwardedDate: forwarded.date,
  };
}

/**
 * When a receipt was paid: the time it prints (local, `YYYY-MM-DDTHH:MM:SS`, taken as Vietnam
 * time), else the forwarded email's own date, else the email's Date, else when it arrived. A time
 * later than its arrival is not believed.
 */
export function emailPaidAt(
  printedLocal: string | null,
  origin: Pick<EmailOrigin, 'forwardedDate'>,
  email: Pick<ReceiptEmail, 'date'>,
  options: ReceiptEmailOptions,
): string {
  const offset = options.utcOffsetMinutes ?? VIETNAM_UTC_OFFSET_MINUTES;
  const fromForward = forwardedTime(origin.forwardedDate);
  const candidates = [
    printedLocal ? inZone(printedLocal, offset) : null,
    fromForward ? inZone(fromForward, offset) : null,
    email.date,
  ];
  const arrived = Date.parse(options.receivedAt);
  return (
    candidates.find((c) => c !== null && Date.parse(c) <= arrived + 10 * 60_000) ??
    new Date(arrived).toISOString()
  );
}

/**
 * Reads the spend in a bank notification or a shop's e-receipt, forwarded or sent on by a filter,
 * with rules alone: the body (HTML tables or plain text) is turned into lines and read like a
 * shared receipt, with shop totals read as the amount. The shop or bank comes from the sender's
 * domain. Returns null for anything that is not a payment out: no amount, or money that came in.
 * The server reads email with a model when it can (`emailSpendOf`); this is what it falls back to.
 */
export function parseReceiptEmail(
  email: ReceiptEmail,
  options: ReceiptEmailOptions,
): EmailReceipt | null {
  const origin = emailOrigin(email);
  const lines = origin.lines.map(withTotalsAsAmount);
  if (isIncoming(lines)) return null;
  const receipt = parseBankReceipt(lines.map((text) => ({ text })));
  if (!receipt || receipt.amount === null) return null;
  return {
    amount: receipt.amount,
    merchant: shopOf(origin.sender) ?? (receipt.payee || payeeInNote(lines)),
    at: emailPaidAt(receipt.at, origin, email, options),
    from: origin.sender?.address ?? null,
    bank: origin.bank ?? receipt.bank,
    code: receipt.code,
    memo: receipt.memo ?? noteIn(lines),
  };
}
