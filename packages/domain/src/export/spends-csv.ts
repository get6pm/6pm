import type { CategoryRow, SpendRow } from '../contracts/local-rows';
import { VND, type Currency, type Money } from '../money/currency';
import type { SpendSource, SpendStatus } from '../spend/spend';

/**
 * Every spend as a CSV file (RFC 4180) that Numbers, Excel and Google Sheets open as they are:
 * UTF-8 with a byte order mark so Vietnamese reads right, CRLF line ends, and a field quoted
 * whenever it holds a comma, a quote or a line break.
 */

/** The columns, in the order the file lists them. */
export const SPENDS_CSV_COLUMNS = [
  'date',
  'time',
  'merchant',
  'category',
  'amount',
  'status',
  'source',
  'wallet',
  'note',
  'detail',
  'forWork',
  'foreignAmount',
  'currency',
] as const;
export type SpendsCsvColumn = (typeof SPENDS_CSV_COLUMNS)[number];

/** The words the file is written in: the header row and the values that are words. */
export interface SpendsCsvLabels {
  readonly headers: Readonly<Record<SpendsCsvColumn, string>>;
  readonly status: Readonly<Record<Exclude<SpendStatus, 'deleted'>, string>>;
  readonly source: Readonly<Record<SpendSource, string>>;
  readonly yes: string;
  readonly no: string;
}

const BOM = '﻿';
const EOL = '\r\n';

/** Quotes a field when it must be, doubling any quote inside it. */
export function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Text a person or a receipt wrote. A spreadsheet runs a cell that starts with `=`, `+`, `-` or
 * `@` as a formula, so a merchant name from a shared receipt could do so too: such text gets a
 * leading apostrophe, which the spreadsheet shows as plain text.
 */
function textCell(value: string | null): string {
  if (value === null) return '';
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** The phone's wall-clock time of an instant, `HH:MM`. */
export function localTimeOf(instant: string): string {
  const at = new Date(instant);
  return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
}

/** Oldest first: by the day the spend counts on, then by when it happened. */
function byDayThenTime(a: SpendRow, b: SpendRow): number {
  if (a.day !== b.day) return a.day < b.day ? -1 : 1;
  return a.at < b.at ? -1 : a.at > b.at ? 1 : 0;
}

/**
 * An amount in the home currency's major units, with its decimals and a point, never grouped:
 * "49000" in đồng, "12.50" in dollars.
 */
export function csvAmount(amount: Money, currency: Currency): string {
  if (currency.minorDigits === 0) return String(amount);
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(Math.round(amount));
  const whole = Math.floor(abs / currency.minorPerMajor);
  const minor = String(abs % currency.minorPerMajor).padStart(currency.minorDigits, '0');
  return `${sign}${whole}.${minor}`;
}

/**
 * The CSV of every spend that is not deleted. The date is the spend's money day (the day it
 * counts on, which a spend just before midnight can move); the amount is in the home currency
 * (`csvAmount`) with no grouping, so it adds up in any spreadsheet. A category since archived
 * still gives its name.
 */
export function spendsCsv(
  spends: readonly SpendRow[],
  categories: readonly CategoryRow[],
  labels: SpendsCsvLabels,
  timeOf: (instant: string) => string = localTimeOf,
  currency: Currency = VND,
): string {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const rows = spends
    .filter((s) => s.status !== 'deleted')
    .sort(byDayThenTime)
    .map((s): Record<SpendsCsvColumn, string> => ({
      date: s.day,
      time: timeOf(s.at),
      merchant: textCell(s.merchant),
      category: textCell(names.get(s.categoryId) ?? null),
      amount: csvAmount(s.amount, currency),
      status: s.status === 'deleted' ? '' : labels.status[s.status],
      source: labels.source[s.source],
      wallet: textCell(s.wallet),
      note: textCell(s.note),
      detail: textCell(s.detail),
      forWork: s.forWork ? labels.yes : labels.no,
      foreignAmount: s.foreignAmount ? String(s.foreignAmount.amount) : '',
      currency: s.foreignAmount ? s.foreignAmount.currency : '',
    }));
  const lines = [
    SPENDS_CSV_COLUMNS.map((column) => csvField(labels.headers[column])),
    ...rows.map((row) => SPENDS_CSV_COLUMNS.map((column) => csvField(row[column]))),
  ];
  return BOM + lines.map((cells) => cells.join(',') + EOL).join('');
}
