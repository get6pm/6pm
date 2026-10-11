import { describe, expect, it } from '@jest/globals';

import type { ClosedDayRow } from '@6pm/domain';

import { monthDots } from './month-dots';

const closed = (day: string): ClosedDayRow => ({
  day,
  closedAt: `${day}T11:00:00.000Z`,
  late: false,
  spent: 0,
  line: 0,
  tomorrow: 0,
  note: null,
});

describe('monthDots', () => {
  it('has a dot for every day of the month, with today popping in', () => {
    const dots = monthDots('2026-10-11', [closed('2026-10-01'), closed('2026-10-09')]);
    expect(dots).toHaveLength(31);
    expect(dots[0]).toBe('closed');
    expect(dots[8]).toBe('closed');
    expect(dots[10]).toBe('today');
    expect(dots[9]).toBe('open');
  });

  it('follows the money day across a month end, not the calendar', () => {
    // 01:00 on 1 November still belongs to 31 October.
    const dots = monthDots('2026-10-31', [closed('2026-10-30')]);
    expect(dots).toHaveLength(31);
    expect(dots[30]).toBe('today');
    expect(dots[29]).toBe('closed');
  });

  it('counts a short month', () => {
    expect(monthDots('2027-02-03', [])).toHaveLength(28);
  });
});
