import type { Row } from './bank-receipt';
import { foldWords } from './spoken-spend';

/** Header lines that are never the shop's name: contacts, form titles, platform lines. */
const NOISE = new RegExp(
  ' (?:' +
    [
      'lien he',
      'khieu nai',
      'hotline',
      'tel',
      'telp',
      'phone',
      'dt',
      'sdt',
      'website',
      'www',
      'http',
      'https',
      'email',
      'delivery',
      'dia chi',
      'd c',
      'phieu',
      'hoa don',
      'print bill',
      'unpaid',
      'invoice',
      'receipt',
      'cashier',
      'thu ngan',
      'ban',
      'table',
      'gio vao',
      'thoi gian',
      'ngay',
      'date',
      'order',
      'cover',
      'member',
      'orang',
      'meja',
      'tanggal',
      'pesanan',
      'server',
      'kasir',
      'keterangan',
      'harga',
      'qty',
      'enter',
      'return',
      'shift',
      'delete',
    ].join('|') +
    ') ',
);

/** An address line: a street number first, or a street, ward or district word. */
const ADDRESS = / (?:duong|phuong|q|p|street|st|road|rd|boulevard|blvd|jl|jalan|br|desa|district) /;

const letters = (text: string) => (text.match(/\p{L}/gu) ?? []).length;
const visible = (text: string) => text.replace(/\s/g, '').length;

/** Vision reads a logo's lettering as words with this confidence or less. */
const LOGO_CONFIDENCE = 0.5;
/** What a shop's name is written with: no links, codes or symbols. */
const NAME_CHARS = /^[\p{L}\p{N}\s&'.,()-]+$/u;

/** A cell that reads as a name: mostly letters, at least four of them, and not noise. */
function nameLike(cell: string, confidence: number): boolean {
  const folded = foldWords(cell);
  if (confidence <= LOGO_CONFIDENCE || NOISE.test(folded) || ADDRESS.test(folded)) return false;
  if (!NAME_CHARS.test(cell) || /^\s*\d/.test(cell) || (cell.match(/\d/g) ?? []).length > 3) {
    return false;
  }
  const count = letters(cell);
  return count >= 4 && count / Math.max(1, visible(cell)) >= 0.6;
}

/** A short line of words under the name that finishes it ("Bình" / "Chánh"). */
function continues(row: Row | undefined): string | null {
  const cell = row?.cells.length === 1 ? (row.cells[0] ?? '') : '';
  const words = cell.trim().split(/\s+/);
  const plain =
    words.filter((word) => word !== '&').length <= 2 &&
    letters(cell) >= 4 &&
    words.every((word) => /^[\p{L}&]+$/u.test(word));
  return plain && !NOISE.test(foldWords(cell)) ? cell : null;
}

/** How many rows from the top a shop's name is looked for in. */
const HEADER_ROWS = 6;
/** A phone number up top can look like a price; the name is still looked for above it. */
const MIN_HEADER_ROWS = 4;

/**
 * The shop's name from a receipt's header: the first cell near the top that reads as a name,
 * joined with the line under it when that only finishes it. A name of two words or more is
 * taken over a single word above it, which is more often a logo read as text. Empty when the
 * header has none (a torn top, a handwritten bill).
 */
export function readShopName(rows: readonly Row[], firstPriceRow: number): string {
  const header = rows.slice(0, Math.min(HEADER_ROWS, Math.max(MIN_HEADER_ROWS, firstPriceRow)));
  const names: string[] = [];
  header.forEach((row, i) => {
    row.cells.forEach((cell, c) => {
      if (!nameLike(cell, row.confidence)) return;
      const tail = c === row.cells.length - 1 ? continues(rows[i + 1]) : null;
      names.push((tail ? `${cell} ${tail}` : cell).replace(/\s+/g, ' ').trim());
    });
  });
  return names.find((name) => name.includes(' ')) ?? names[0] ?? '';
}
