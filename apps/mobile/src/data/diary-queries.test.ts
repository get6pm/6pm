import { describe, expect, it, jest } from '@jest/globals';

import { futureYouOfMonth } from './diary-queries';

jest.mock('@sentry/react-native', () => ({ captureException: jest.fn() }));
jest.mock('./money-provider', () => ({ useMoneySelector: jest.fn(), useMoneyStore: jest.fn() }));

const lastDay = { kind: 'lastDay' } as const;

describe('futureYouOfMonth', () => {
  const moves = [
    // The cycle that began on 30 Sep is October's: most of its days are in October.
    { kind: 'setAside', amount: 2_000_000, cycle: '2026-09-30', at: '2026-09-30T20:00:00.000Z' },
    { kind: 'setAside', amount: 2_000_000, cycle: '2026-10-31', at: '2026-10-31T20:00:00.000Z' },
    { kind: 'topUp', amount: 100_000, cycle: '2026-09-30', at: '2026-10-05T05:00:00.000Z' },
    { kind: 'topUp', amount: 300_000, cycle: '2026-10-31', at: '2026-11-02T05:00:00.000Z' },
  ];

  it('files a top-up in the month it was made, not the pay cycle it belongs to', () => {
    // 5 Oct falls in the cycle that began on 30 Sep, but it is October's money diary.
    const october = futureYouOfMonth(moves, '2026-10', lastDay);
    expect(october.added).toBe(2_000_000 + 100_000);
  });

  it('files a cycle’s set-aside in the month most of the cycle lies in', () => {
    const november = futureYouOfMonth(moves, '2026-11', lastDay);
    expect(november.added).toBe(2_000_000 + 300_000);
  });

  it('adds everything up to the end of the month for the total', () => {
    expect(futureYouOfMonth(moves, '2026-10', lastDay).total).toBe(2_100_000);
    expect(futureYouOfMonth(moves, '2026-11', lastDay).total).toBe(4_400_000);
    expect(futureYouOfMonth(moves, '2026-09', lastDay)).toEqual({ added: 0, total: 0 });
  });
});
