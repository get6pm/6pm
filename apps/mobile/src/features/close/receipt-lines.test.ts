import { describe, expect, it } from '@jest/globals';

import { sumCounted, type SpendRow } from '@6pm/domain';

import { receiptSpends } from './receipt-lines';

const stamp = '2026-10-11T03:00:00.000Z';
const spend = (id: string, patch: Partial<SpendRow>): SpendRow => ({
  id,
  day: '2026-10-11',
  at: `2026-10-11T0${id.length}:00:00.000Z`,
  amount: 10_000,
  categoryId: 'food',
  merchant: id,
  note: null,
  source: 'manual',
  status: 'kept',
  previousStatus: null,
  wallet: null,
  forWork: false,
  detail: null,
  foreignAmount: null,
  createdAt: stamp,
  updatedAt: stamp,
  ...patch,
});

describe('receiptSpends', () => {
  const notDaily = new Set(['rent']);
  const day = [
    spend('a', { amount: 45_000 }),
    spend('bb', { amount: 3_000_000, categoryId: 'rent' }),
    spend('ccc', { amount: 120_000, forWork: true }),
    spend('dddd', { amount: 20_000, status: 'skipped' }),
    spend('eeeee', { amount: 9_000, day: '2026-10-10' }),
  ];

  it('prints only what counts, so the lines add up to the total', () => {
    const { lines, claimBack } = receiptSpends(day, '2026-10-11', notDaily);
    expect(lines.map((s) => s.id)).toEqual(['a']);
    expect(claimBack?.id).toBe('ccc');
    const total = sumCounted(
      day
        .filter((s) => s.day === '2026-10-11')
        .map((s) => ({
          amount: s.amount,
          category: s.categoryId,
          status: s.status,
          forWork: s.forWork,
        })),
      notDaily,
    );
    expect(lines.reduce((sum, s) => sum + s.amount, 0)).toBe(total);
  });

  it('is empty on a day with nothing kept', () => {
    expect(receiptSpends([], '2026-10-11', notDaily)).toEqual({ lines: [], claimBack: null });
  });
});
