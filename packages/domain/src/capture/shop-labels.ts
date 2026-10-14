import { foldWords } from './spoken-spend';
import { readPrintedNumber } from './wallet-amount';

/**
 * What a labelled line of a shop receipt is. `final` is what is left to pay ("Tổng còn lại",
 * "Amount due"), `total` the bill's total, `running` a line total ("Thành tiền"), `paid` what a
 * card or wallet was charged, `subtotal` before discounts and tax. The rest never is the total:
 * a discount, a tax or service line, change, cash handed over, a count of items.
 */
export type ShopLabel =
  'final' | 'total' | 'running' | 'paid' | 'subtotal' | 'discount' | 'extra' | 'other';

/** How strongly a label names the total, for the kinds that can be one. */
export const TOTAL_RANK: Readonly<Partial<Record<ShopLabel, number>>> = {
  final: 3,
  total: 2,
  running: 1,
};

/** Receipt labels, folded (no accents, lower case), in Vietnamese, English and Indonesian. */
const LABELS: Readonly<Record<ShopLabel, string>> = {
  final:
    'tong con lai, con phai thu, con lai, khach phai tra, khach can tra, can thanh toan, ' +
    'phai thanh toan, tien phai tra, tong thanh toan, total amount, grand total, amount due, ' +
    'total due, balance due, net total, to pay, total payable, amount payable, total jumlah, ' +
    'total harga, total bayar',
  total: 'tong cong, tong tien, tong, thanh toan, total, jumlah',
  running: 'thanh tien',
  paid:
    'visa, mastercard, master card, credit card, debit card, card, payment, momo, zalopay, ' +
    'vnpay, shopeepay, chuyen khoan, bca, total paid',
  subtotal: 'tam tinh, tong tam tinh, tong tien hang, tien hang, subtotal, sub total, tong phu',
  discount:
    'giam gia, giam mon, chiet khau, khuyen mai, khuyen mai, discount, voucher, diskon, promo, ' +
    'tien phieu giam gia, tong giam gia, tong giam gia mon',
  extra:
    'vat, tax, gst, service, service charge, service tax, phi dich vu, phi phuc vu, thue, pajak',
  other:
    'tien thua, tien thoi, tien thua tra khach, change, change due, tien khach dua, khach dua, ' +
    'tien nhan, cash, tendered, total item, total items, total qty, tong so mon, tong so luong, ' +
    'tong sl, so luong, incl gst, thanh toan tien mat, card no, card number, member',
};

/** Longest first, so "tổng tiền hàng" is a subtotal before "tổng tiền" is a total. */
const ORDERED: readonly (readonly [string, ShopLabel])[] = (
  Object.entries(LABELS) as [ShopLabel, string][]
)
  .flatMap(([kind, labels]) => labels.split(/\s*,\s*/).map((label) => [label, kind] as const))
  .sort((a, b) => b[0].length - a[0].length);

/** The label a cell starts with. */
export function shopLabelOf(cell: string): ShopLabel | null {
  const folded = foldWords(cell);
  return ORDERED.find(([label]) => folded.startsWith(` ${label} `))?.[1] ?? null;
}

/** Thousands grouped by a separator or a space ("1,875,000", "105 000"), or a plain number. */
const AMOUNT =
  /\d{1,3}(?:(?:[.,]|\s)\d{3})+(?:[.,]\d{1,2})?(?![\d.,]\d)|\d+(?:[.,]\d{1,2})?(?![\d.,]\d)/g;

/** A number read from a receipt: its value and whether it was printed with cents. */
export interface PrintedAmount {
  readonly value: number;
  readonly cents: boolean;
}

/** The last amount in a piece of text, the column receipts print totals in. */
export function lastAmount(text: string): PrintedAmount | null {
  const cleaned = text
    .replace(/\d+(?:[.,]\d+)?\s?%/g, ' ')
    .replace(/(\d[.,])\s(\d{3})(?!\d)/g, '$1$2');
  const found = cleaned.match(AMOUNT);
  const raw = found?.[found.length - 1];
  if (raw === undefined) return null;
  const value = readPrintedNumber(raw.replace(/\s/g, ''));
  if (value === null || !Number.isFinite(value)) return null;
  return { value, cents: /[.,]\d{1,2}$/.test(raw) && !/[.,]\d{3}$/.test(raw) };
}

/** Whether the receipt prints its prices with cents ("13.00", "9.70") rather than thousands. */
export function printsCents(rows: readonly string[]): boolean {
  let cents = 0;
  let thousands = 0;
  for (const row of rows) {
    cents += (row.match(/\d[.,]\d{2}(?![\d.,])/g) ?? []).length;
    thousands += (row.match(/\d[.,]\d{3}(?![\d])/g) ?? []).length;
  }
  return cents >= 2 && cents > thousands;
}
