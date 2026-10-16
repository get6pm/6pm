import type { DailyNumber } from '../plan/daily-number';
import type { SpendStatus } from '../spend/spend';
import type { InsightInput, InsightSpend } from './fact';

/** Test helpers: a ledger in the design's month (payday 31st, today Fri 9 Oct 2026). */

export const TODAY = '2026-10-09';

export function day(overrides: Partial<DailyNumber> = {}): DailyNumber {
  return {
    startFree: 8_073_000,
    line: 351_000,
    spent: 0,
    free: 8_073_000,
    safe: 351_000,
    tomorrow: 351_000,
    replan: false,
    overspent: false,
    ...overrides,
  };
}

let next = 0;

export function spend(
  dayOf: string,
  merchant: string,
  amount: number,
  category = 'food',
  status: SpendStatus = 'kept',
  extra: Partial<InsightSpend> = {},
): InsightSpend {
  next += 1;
  return {
    id: `s${String(next)}`,
    day: dayOf,
    merchant,
    amount,
    category,
    status,
    source: 'manual',
    ...extra,
  };
}

export function input(overrides: Partial<InsightInput> = {}): InsightInput {
  return {
    today: TODAY,
    day: day(),
    cycle: { start: '2026-09-30', payday: '2026-10-31', daysLeft: 22 },
    previousCycleStart: '2026-08-31',
    spends: [],
    closed: [],
    notDaily: new Set(['home']),
    bills: [],
    pots: [],
    ...overrides,
  };
}
