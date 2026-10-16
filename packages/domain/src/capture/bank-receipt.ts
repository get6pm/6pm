import { MEMO_MAX } from '../contracts/local-rows';
import type { Vnd } from '../money/format';
import { BANKS } from '../vietqr/bank-catalogue';
import { readReceiptTime } from './receipt-time';
import { dongIn, heroAmount } from './receipt-amount';
import { foldWords } from './spoken-spend';

export { readReceiptTime } from './receipt-time';

/** Where a line sits, in Vision's normalised coordinates: 0…1, origin at the bottom left. */
export interface ReceiptBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** One line of a receipt as the recogniser (or a PDF's text, or a shared text) gave it. */
export interface ReceiptLine {
  readonly text: string;
  /** Absent for text that had no layout (a plain-text share): lines are then rows in order. */
  readonly box?: ReceiptBox;
  /** The recogniser's confidence, 0…1, when it gave one. */
  readonly confidence?: number;
}

export interface BankReceipt {
  readonly amount: Vnd | null;
  /** Who was paid, as printed. Empty when no name was found. */
  readonly payee: string;
  /** False when the name is a bare account name (or unread): the card asks to check it. */
  readonly payeeSure: boolean;
  /** When the transfer was made (ISO 8601), read as the phone's local time. */
  readonly at: string | null;
  /** The bank's transaction code, spaces taken out. */
  readonly code: string | null;
  /** The sending bank's short name from the VietQR catalogue: "Vietcombank", "MoMo". */
  readonly bank: string | null;
  /**
   * The transfer's own words as printed ("Nội dung: Thanh toan the tin dung"), where a repayment
   * is usually named. Null when the receipt prints none.
   */
  readonly memo: string | null;
}

/** A memo as kept: one line, spaces collapsed, cut to `MEMO_MAX`; null when it says nothing. */
export function cleanMemo(value: string | null | undefined): string | null {
  const memo = (value ?? '').replace(/\s+/g, ' ').trim().slice(0, MEMO_MAX).trim();
  return /\p{L}/u.test(memo) ? memo : null;
}

export type Field =
  'amount' | 'payee' | 'time' | 'code' | 'toBank' | 'account' | 'note' | 'fee' | 'balance';

/** Receipt labels in Vietnamese and English, folded (no accents, lower case), by field. */
const LABELS: Readonly<Record<Field, string>> = {
  amount:
    'so tien, so tien giao dich, so tien gd, so tien chuyen, phat sinh, so tien phat sinh, ' +
    'gd, amount, transaction amount, debit amount, tong tien',
  payee:
    'toi, to, den, chuyen den, nguoi nhan, ten nguoi nhan, nguoi huong, ten nguoi huong, ' +
    'nguoi thu huong, ten nguoi thu huong, don vi thu huong, ten tai khoan nhan, ' +
    'ten tai khoan thu huong, beneficiary, beneficiary name, recipient, receiver, payee',
  time:
    'thoi gian, thoi gian giao dich, ngay giao dich, ngay thuc hien, ngay gio, ngay, ' +
    'ngay gio giao dich, time, date, transaction date, transaction time, trans date time',
  code:
    'ma giao dich, ma gd, so tham chieu, ma tham chieu, so but toan, transaction id, ' +
    'transaction code, transaction no, reference, reference no, ref no, trace',
  toBank: 'ngan hang nhan, ngan hang huong, ngan hang thu huong, ngan hang, beneficiary bank, bank',
  account:
    'so tai khoan, tai khoan, tai khoan nhan, tai khoan thu huong, tai khoan nguoi huong, ' +
    'tai khoan nguon, tu tai khoan, so dien thoai, account, account number, from account',
  note:
    'noi dung, noi dung chuyen tien, noi dung chuyen khoan, noi dung giao dich, loi nhan, ' +
    'message, description, details, details of payment, payment details, remark, dien giai',
  fee: 'phi, phi giao dich, tong phi, fee, transaction fee',
  balance: 'so du, so du kha dung, balance, available balance',
};

const LABEL_INDEX = new Map<string, Field>(
  (Object.entries(LABELS) as [Field, string][]).flatMap(([field, labels]) =>
    labels.split(/\s*,\s*/).map((label) => [label, field] as const),
  ),
);

/** Labels that name a balance whatever follows them: "Số dư cuối", "SD TK 0071", "Balance after". */
const BALANCE_LABEL = /^ (?:so du|sd|sdc|balance|available balance) /;

/** The field a label names. Bilingual PDF labels ("Số tiền / Amount (VND)") match either part. */
function labelOf(text: string): Field | null {
  const parts = text.replace(/\(.*?\)/g, ' ').split('/');
  for (const part of parts) {
    const folded = foldWords(part);
    const balance = BALANCE_LABEL.test(folded) && !/\d/.test(part);
    const field = LABEL_INDEX.get(folded.trim()) ?? (balance ? 'balance' : null);
    if (field) return field;
  }
  return null;
}

export interface Row {
  readonly cells: string[];
  readonly confidence: number;
  readonly height: number;
}

/** Lines grouped into rows by their vertical centre, top first, each row left to right. */
export function toRows(lines: readonly ReceiptLine[]): Row[] {
  const usable = lines.filter((line) => line.text.trim() !== '');
  if (!usable.every((line) => line.box)) {
    return usable.map((line) => ({
      cells: splitCells(line.text),
      confidence: line.confidence ?? 1,
      height: 0,
    }));
  }
  const centre = (line: ReceiptLine) => (line.box ? line.box.y + line.box.h / 2 : 0);
  const sorted = [...usable].sort((a, b) => centre(b) - centre(a));
  const groups: ReceiptLine[][] = [];
  for (const line of sorted) {
    const group = groups[groups.length - 1];
    const first = group?.[0];
    const tolerance = Math.max(first?.box?.h ?? 0, line.box?.h ?? 0) / 2;
    if (group && first && Math.abs(centre(first) - centre(line)) <= tolerance) group.push(line);
    else groups.push([line]);
  }
  return groups.map((group) => {
    const ordered = group.sort((a, b) => (a.box?.x ?? 0) - (b.box?.x ?? 0));
    return {
      cells: ordered.flatMap((line) => splitCells(line.text)),
      confidence: Math.min(...ordered.map((line) => line.confidence ?? 1)),
      height: Math.max(...ordered.map((line) => line.box?.h ?? 0)),
    };
  });
}

/** "Số tiền: 120.000 VND" or "Số tiền    120.000 VND" (a text share) as label and value. */
function splitCells(text: string): string[] {
  const t = text.trim();
  const colon = /^([^:\d]{2,60}):\s*(.+)$/u.exec(t);
  if (colon?.[1] && colon[2] && labelOf(colon[1])) return [colon[1].trim(), colon[2].trim()];
  const gap = t.split(/\t+|\s{3,}/);
  return gap.length > 1 && labelOf(gap[0] ?? '') ? gap.map((cell) => cell.trim()) : [t];
}

interface Found {
  readonly value: string;
  readonly confidence: number;
}

/** Each labelled value: on the label's row, or on the row under a label that stands alone. */
export function readFields(rows: readonly Row[]): {
  fields: Map<Field, Found>;
  rowFields: (Field | null)[];
} {
  const fields = new Map<Field, Found>();
  const rowFields: (Field | null)[] = rows.map(() => null);
  rows.forEach((row, i) => {
    if (rowFields[i] !== null) return;
    const field = labelOf(row.cells[0] ?? '');
    if (!field) return;
    rowFields[i] = field;
    let found: Found | null = null;
    if (row.cells.length > 1)
      found = { value: row.cells.slice(1).join(' '), confidence: row.confidence };
    else {
      const below = rows[i + 1];
      if (below && labelOf(below.cells[0] ?? '') === null) {
        rowFields[i + 1] = field;
        found = { value: below.cells.join(' '), confidence: below.confidence };
      }
    }
    if (found && !fields.has(field)) fields.set(field, found);
  });
  return { fields, rowFields };
}

/** A name as the bank registered it rather than the shop's own: all capitals, or a company. */
function looksLikeAccountName(name: string): boolean {
  const company = /^(?:cong ty|cty|tnhh|chi nhanh|cn|ho kinh doanh|hkd) /;
  return !/\p{Ll}/u.test(name) || company.test(foldWords(name).trim() + ' ');
}

function cleanPayee(value: string): string {
  return value
    .replace(/[-–|]\s*\d[\d\s.]*$/u, '')
    .replace(/^\d[\d\s.]*[-–|]\s*/u, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '');
}

/** "Chuyển tiền tới CIRCLE K VN lúc 16:40" in a text share with no labels. */
const PAYEE_IN_SENTENCE =
  /(?:^|\s)(?:tới|toi|đến|den|to)\s+(.+?)(?=\s+(?:lúc|luc|at|vào|vao|ngày|ngay|stk|tk|số|so)(?:\s|$)|[.,;]|$)/iu;

function readCode(value: string | undefined, allText: string): string | null {
  const code = value?.replace(/\s+/g, '');
  if (code && /\d/.test(code) && /^[A-Za-z0-9.\-_/]{6,40}$/.test(code)) return code;
  return /\bFT\d{5}[A-Z0-9]*\b/.exec(allText)?.[0] ?? null;
}

const BANK_INDEX = new Map<string, string>(
  BANKS.flatMap((bank) => {
    const keys = [foldWords(bank.shortName).replace(/ /g, '')];
    if (bank.id.length >= 3) keys.push(bank.id.toLowerCase());
    return keys.map((key) => [key, bank.shortName] as const);
  }),
);

/** The sending bank: the first catalogue name in reading order, skipping the payee's bank. */
function readBank(rows: readonly Row[], rowFields: readonly (Field | null)[]): string | null {
  for (let i = 0; i < rows.length; i++) {
    const field = rowFields[i];
    if (field === 'toBank' || field === 'payee' || field === 'note') continue;
    const words = foldWords((rows[i] as Row).cells.join(' '))
      .trim()
      .split(' ');
    for (let w = 0; w < words.length; w++) {
      const pair = (words[w] ?? '') + (words[w + 1] ?? '');
      const name = BANK_INDEX.get(pair) ?? BANK_INDEX.get(words[w] ?? '');
      if (name) return name;
    }
  }
  return null;
}

/** The receipt's text in reading order, one row per line, whatever order the lines came in. */
export function receiptReadingOrder(lines: readonly ReceiptLine[]): string[] {
  return toRows(lines).map((row) => row.cells.join(' '));
}

/**
 * Reads a transfer receipt from any Vietnamese bank or wallet: lines are grouped into rows by
 * their boxes, then labels are matched in Vietnamese and English (Số tiền / Amount, Tới / Người
 * nhận / Beneficiary / Đơn vị thụ hưởng, Thời gian, Mã giao dịch / Số tham chiếu / FT…). Returns
 * null when nothing on it reads as a receipt.
 */
export function parseBankReceipt(lines: readonly ReceiptLine[]): BankReceipt | null {
  const rows = toRows(lines);
  const { fields, rowFields } = readFields(rows);
  const allText = rows.map((row) => row.cells.join(' ')).join('\n');
  const labelled = fields.get('amount');
  const amount = (labelled ? dongIn(labelled.value) : null) ?? heroAmount(rows, rowFields);
  const payeeFound = fields.get('payee');
  const sentence = payeeFound ? undefined : PAYEE_IN_SENTENCE.exec(allText)?.[1];
  const payee = cleanPayee(payeeFound?.value ?? sentence ?? '');
  const named = /\p{L}/u.test(payee) ? payee : '';
  const confidence = payeeFound?.confidence ?? 1;
  const at =
    readReceiptTime(fields.get('time')?.value ?? '') ??
    rows.map((row) => readReceiptTime(row.cells.join(' '))).find((read) => read !== null) ??
    null;
  const code = readCode(fields.get('code')?.value, allText);
  const bank = readBank(rows, rowFields);
  const memo = cleanMemo(fields.get('note')?.value);
  if (amount === null && named === '' && code === null && at === null) return null;
  return {
    amount: amount !== null && amount > 0 ? amount : null,
    payee: named,
    payeeSure: named !== '' && confidence >= 0.5 && !looksLikeAccountName(named),
    at,
    code,
    bank,
    memo,
  };
}
