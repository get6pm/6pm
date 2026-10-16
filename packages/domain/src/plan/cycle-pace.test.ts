import { describe, expect, it } from 'vitest';

import { cyclePace, lineAhead } from './cycle-pace';

const october = { start: '2026-10-01', payday: '2026-10-31', daysLeft: 22 };

describe('cyclePace', () => {
  it('reads the design: 31% used with 9 of 31 days gone is steady', () => {
    const pace = cyclePace({
      spent: 3_100_000,
      free: 6_900_000,
      cycle: october,
      today: '2026-10-09',
    });
    expect(pace.used).toBeCloseTo(0.31);
    expect(pace.gone).toBeCloseTo(9 / 31);
    expect(pace.pace).toBe('steady');
  });

  it('calls it fast once the money runs more than a little ahead of the days', () => {
    const pace = cyclePace({
      spent: 4_000_000,
      free: 6_000_000,
      cycle: october,
      today: '2026-10-09',
    });
    expect(pace.pace).toBe('fast');
  });

  it('counts the first day and the payday as cycle days', () => {
    expect(cyclePace({ spent: 0, free: 1, cycle: october, today: '2026-10-01' }).gone).toBeCloseTo(
      1 / 31,
    );
    expect(cyclePace({ spent: 0, free: 1, cycle: october, today: '2026-10-31' }).gone).toBe(1);
  });

  it('is all used once the free money is gone, and nothing used before anything is spent', () => {
    expect(
      cyclePace({ spent: 500_000, free: -200_000, cycle: october, today: '2026-10-09' }).used,
    ).toBe(1);
    expect(cyclePace({ spent: 0, free: 0, cycle: october, today: '2026-10-09' }).used).toBe(0);
  });
});

describe('lineAhead', () => {
  it("gives tomorrow's line to each day after today through the payday", () => {
    expect(lineAhead('2026-10-10', '2026-10-09', '2026-10-31', 520_000)).toBe(520_000);
    expect(lineAhead('2026-10-31', '2026-10-09', '2026-10-31', 520_000)).toBe(520_000);
  });

  it('gives nothing to today, to days gone, or to the next cycle', () => {
    expect(lineAhead('2026-10-09', '2026-10-09', '2026-10-31', 520_000)).toBeNull();
    expect(lineAhead('2026-10-02', '2026-10-09', '2026-10-31', 520_000)).toBeNull();
    expect(lineAhead('2026-11-01', '2026-10-09', '2026-10-31', 520_000)).toBeNull();
  });
});
