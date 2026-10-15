import { describe, expect, it } from 'vitest';

import type { SpendRow } from '../contracts/local-rows';
import { currencyOf } from '../money/currency';
import { csvAmount, spendsCsv, SPENDS_CSV_COLUMNS, type SpendsCsvLabels } from './spends-csv';

const USD = currencyOf('USD');

describe('csvAmount', () => {
  it('writes the home currency with its decimals and a point, never grouped', () => {
    expect(csvAmount(1250, USD)).toBe('12.50');
    expect(csvAmount(5, USD)).toBe('0.05');
    expect(csvAmount(-700, USD)).toBe('-7.00');
    expect(csvAmount(123_456_789, USD)).toBe('1234567.89');
    expect(csvAmount(1234, currencyOf('KWD'))).toBe('1.234');
    expect(csvAmount(500, currencyOf('JPY'))).toBe('500');
  });

  it('keeps đồng as whole numbers, as the file always had them', () => {
    expect(csvAmount(49_000, currencyOf('VND'))).toBe('49000');
  });
});

describe('spendsCsv in a home currency', () => {
  const labels = {
    headers: Object.fromEntries(SPENDS_CSV_COLUMNS.map((c) => [c, c])),
    status: { kept: 'Kept', caught: 'Caught', pending: 'Pending', skipped: 'Skipped' },
    source: {
      manual: 'Typed',
      voice: 'Voice',
      shared: 'Shared',
      qr: 'QR',
      email: 'Email',
      applePay: 'Apple Pay',
      cash: 'Cash',
    },
    yes: 'Yes',
    no: 'No',
  } as SpendsCsvLabels;
  const spend = {
    id: 's1',
    day: '2026-10-09',
    at: '2026-10-09T11:05:00.000Z',
    amount: 1250,
    categoryId: 'food',
    merchant: 'Blue Bottle',
    status: 'kept',
    source: 'manual',
    wallet: null,
    note: null,
    forWork: false,
    detail: null,
    foreignAmount: null,
    createdAt: '2026-10-09T11:05:00.000Z',
    updatedAt: '2026-10-09T11:05:00.000Z',
  } as unknown as SpendRow;

  it('writes each amount in major units', () => {
    const csv = spendsCsv([spend], [], labels, () => '18:05', USD);
    const row = csv.slice(1).split('\r\n')[1]?.split(',') ?? [];
    expect(row[SPENDS_CSV_COLUMNS.indexOf('amount')]).toBe('12.50');
  });
});
