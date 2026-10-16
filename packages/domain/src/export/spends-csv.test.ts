import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { CategoryRow, SpendRow } from '../contracts/local-rows';
import { csvField, localTimeOf, spendsCsv, type SpendsCsvLabels } from './spends-csv';

const labels: SpendsCsvLabels = {
  headers: {
    date: 'Date',
    time: 'Time',
    merchant: 'Merchant',
    category: 'Category',
    amount: 'Amount (VND)',
    status: 'Status',
    source: 'Source',
    wallet: 'Wallet',
    note: 'Note',
    detail: 'Details',
    forWork: 'For work',
    foreignAmount: 'Foreign amount',
    currency: 'Currency',
  },
  status: { kept: 'Confirmed', caught: 'Waiting', pending: 'Not paid yet', skipped: 'Not mine' },
  source: {
    manual: 'Manual',
    voice: 'Voice',
    shared: 'Shared receipt',
    qr: 'QR',
    email: 'Email',
    applePay: 'Apple Pay',
    cash: 'Cash',
  },
  yes: 'Yes',
  no: 'No',
};

const base = { icon: 'cup', hue: 30, countsDaily: true, sort: 0, archivedAt: null };
const categories: CategoryRow[] = [
  { ...base, id: 'food', name: 'Ăn uống' },
  { ...base, id: 'old', name: 'Cà phê', archivedAt: '2026-09-01T00:00:00Z' },
];

const spend = (over: Partial<SpendRow> = {}): SpendRow => ({
  id: 's1',
  day: '2026-10-09',
  at: '2026-10-09T11:05:00.000Z',
  amount: 45_000,
  categoryId: 'food',
  merchant: 'Phở Thìn',
  note: null,
  source: 'manual',
  status: 'kept',
  previousStatus: null,
  wallet: null,
  forWork: false,
  detail: null,
  foreignAmount: null,
  createdAt: '2026-10-09T11:05:00.000Z',
  updatedAt: '2026-10-09T11:05:00.000Z',
  ...over,
});

const fixedTime = (instant: string) => instant.slice(11, 16);

/** A strict RFC 4180 reader, to check the file reads back to the same cells. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\r' && text[i + 1] === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i++;
    } else cell += c;
  }
  expect([cell, row]).toEqual(['', []]);
  return rows;
}

const read = (csv: string) => parseCsv(csv.slice(1));

describe('spendsCsv', () => {
  it('starts with a UTF-8 byte order mark and ends every line with CRLF', () => {
    const csv = spendsCsv([spend()], categories, labels, fixedTime);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(csv.slice(1).split('\r\n')).toHaveLength(3);
  });

  it('writes the header row in the given words', () => {
    const [header] = read(spendsCsv([], categories, labels, fixedTime));
    expect(header).toEqual(Object.values(labels.headers));
  });

  it('writes one row per spend with whole đồng and no grouping', () => {
    const rows = read(
      spendsCsv(
        [spend({ amount: 1_250_000, wallet: 'Techcombank', note: 'Sáng', forWork: true })],
        categories,
        labels,
        fixedTime,
      ),
    );
    expect(rows[1]).toEqual([
      '2026-10-09',
      '11:05',
      'Phở Thìn',
      'Ăn uống',
      '1250000',
      'Confirmed',
      'Manual',
      'Techcombank',
      'Sáng',
      '',
      'Yes',
      '',
      '',
    ]);
  });

  it('leaves deleted spends out and keeps every other status', () => {
    const rows = read(
      spendsCsv(
        [
          spend({ id: 'a', status: 'deleted' }),
          spend({ id: 'b', status: 'caught', at: '2026-10-09T01:00:00.000Z' }),
          spend({ id: 'c', status: 'pending', at: '2026-10-09T02:00:00.000Z' }),
          spend({ id: 'd', status: 'skipped', at: '2026-10-09T03:00:00.000Z' }),
          spend({ id: 'e', status: 'kept', at: '2026-10-09T04:00:00.000Z' }),
        ],
        categories,
        labels,
        fixedTime,
      ),
    );
    expect(rows.slice(1).map((r) => r[5])).toEqual([
      'Waiting',
      'Not paid yet',
      'Not mine',
      'Confirmed',
    ]);
  });

  it('dates a spend by its money day, oldest first, then by time', () => {
    const rows = read(
      spendsCsv(
        [
          spend({ id: 'late', day: '2026-10-09', at: '2026-10-09T16:59:00.000Z' }),
          // Caught after midnight but filed on the day before.
          spend({ id: 'filed', day: '2026-10-08', at: '2026-10-08T17:10:00.000Z' }),
          spend({ id: 'early', day: '2026-10-09', at: '2026-10-09T01:00:00.000Z' }),
        ],
        categories,
        labels,
        fixedTime,
      ),
    );
    expect(rows.slice(1).map((r) => `${r[0]} ${r[1]}`)).toEqual([
      '2026-10-08 17:10',
      '2026-10-09 01:00',
      '2026-10-09 16:59',
    ]);
  });

  it('quotes commas, quotes and line breaks in names and notes', () => {
    const csv = spendsCsv(
      [
        spend({
          merchant: 'Bún chả "Hương Liên", Hà Nội',
          note: 'line one\nline two\r\nline three',
        }),
      ],
      categories,
      labels,
      fixedTime,
    );
    expect(csv).toContain('"Bún chả ""Hương Liên"", Hà Nội"');
    const rows = read(csv);
    expect(rows[1]?.[2]).toBe('Bún chả "Hương Liên", Hà Nội');
    expect(rows[1]?.[8]).toBe('line one\nline two\r\nline three');
  });

  it('keeps the name of an archived category and leaves an unknown one blank', () => {
    const rows = read(
      spendsCsv(
        [
          spend({ id: 'a', categoryId: 'old', at: '2026-10-09T01:00:00.000Z' }),
          spend({ id: 'b', categoryId: 'gone', at: '2026-10-09T02:00:00.000Z' }),
        ],
        categories,
        labels,
        fixedTime,
      ),
    );
    expect(rows.slice(1).map((r) => r[3])).toEqual(['Cà phê', '']);
  });

  it('writes the foreign amount and its currency for a spend abroad', () => {
    const rows = read(
      spendsCsv(
        [
          spend({
            amount: 318_000,
            foreignAmount: { currency: 'USD', amount: 12.5, rate: 25_440 },
          }),
        ],
        categories,
        labels,
        fixedTime,
      ),
    );
    expect(rows[1]?.slice(4, 5)).toEqual(['318000']);
    expect(rows[1]?.slice(11)).toEqual(['12.50', 'USD']);
  });

  it('names each source in the given words', () => {
    const rows = read(
      spendsCsv(
        [spend({ source: 'applePay', detail: 'VCB · FT123' })],
        categories,
        labels,
        fixedTime,
      ),
    );
    expect(rows[1]?.[6]).toBe('Apple Pay');
    expect(rows[1]?.[9]).toBe('VCB · FT123');
  });

  it('keeps a spreadsheet from running text that looks like a formula', () => {
    const rows = read(
      spendsCsv(
        [spend({ merchant: '=HYPERLINK("x")', note: '+84 90', wallet: '@bank' })],
        categories,
        labels,
        fixedTime,
      ),
    );
    expect(rows[1]?.[2]).toBe(`'=HYPERLINK("x")`);
    expect(rows[1]?.[7]).toBe(`'@bank`);
    expect(rows[1]?.[8]).toBe(`'+84 90`);
    // The amount is a number and is never prefixed.
    expect(rows[1]?.[4]).toBe('45000');
  });

  it('has only the header row when there is nothing to export', () => {
    expect(read(spendsCsv([spend({ status: 'deleted' })], categories, labels, fixedTime))).toEqual([
      Object.values(labels.headers),
    ]);
  });

  it('does not reorder the spends it was given', () => {
    const given = [spend({ id: 'b', day: '2026-10-10' }), spend({ id: 'a', day: '2026-10-01' })];
    spendsCsv(given, categories, labels, fixedTime);
    expect(given.map((s) => s.id)).toEqual(['b', 'a']);
  });

  it('reads back to the same merchant and note for any text', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (merchant, note) => {
        const safe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
        const rows = read(spendsCsv([spend({ merchant, note })], categories, labels, fixedTime));
        expect(rows).toHaveLength(2);
        expect(rows[1]?.[2]).toBe(safe(merchant));
        expect(rows[1]?.[8]).toBe(safe(note));
      }),
    );
  });
});

describe('csvField', () => {
  it('leaves plain text alone and quotes what needs it', () => {
    expect(csvField('Phở')).toBe('Phở');
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('a\nb')).toBe('"a\nb"');
    expect(csvField('a\rb')).toBe('"a\rb"');
  });
});

describe('localTimeOf', () => {
  it('gives the phone’s wall-clock hour and minute', () => {
    const at = new Date(2026, 9, 9, 7, 4);
    expect(localTimeOf(at.toISOString())).toBe('07:04');
  });
});
