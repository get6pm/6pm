import { describe, expect, it } from 'vitest';

import { addDays, daysInMonth, makeDate } from '../time/local-date';
import { cycleMonth, payCycleOn, type Payday } from './pay-cycle';

const lastDay: Payday = { kind: 'lastDay' };

/** Every payday rule there is: the 1st to the 31st, the last day, and "it varies". */
const paydays: Payday[] = [
  ...Array.from({ length: 31 }, (_, i): Payday => ({ kind: 'sameDay', day: i + 1 })),
  lastDay,
  { kind: 'varies' },
];

/** The cycle that begins on each month's payday, in order, across `years` (leap years included). */
function cyclesAcross(payday: Payday, years: readonly number[]) {
  const cycles = [];
  for (const year of years) {
    for (let month = 1; month <= 12; month++) {
      const day =
        payday.kind === 'sameDay'
          ? Math.min(payday.day, daysInMonth(year, month))
          : daysInMonth(year, month);
      cycles.push(payCycleOn(makeDate(year, month, day), payday));
    }
  }
  return cycles;
}

/** Every place where a cycle does not come the month after the one before it, or shifts mid-cycle. */
function misnamed(payday: Payday, years: readonly number[]): string[] {
  const cycles = cyclesAcross(payday, years);
  const bad: string[] = [];
  cycles.forEach((cycle, i) => {
    const before = cycles[i - 1];
    if (before && cycleMonth(cycle) !== nextMonth(cycleMonth(before))) {
      bad.push(`${JSON.stringify(payday)} ${cycle.start} follows ${before.start}`);
    }
    const inside = addDays(cycle.start, 1);
    if (inside < cycle.payday && cycleMonth(payCycleOn(inside, payday)) !== cycleMonth(cycle)) {
      bad.push(`${JSON.stringify(payday)} ${cycle.start} changes name on ${inside}`);
    }
  });
  return bad;
}

function nextMonth(month: string): string {
  const [y = 0, m = 1] = month.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

describe('cycleMonth', () => {
  it('names a cycle by the month holding the day before its payday', () => {
    expect(cycleMonth(payCycleOn('2026-10-11', lastDay))).toBe('2026-10');
    expect(cycleMonth(payCycleOn('2026-10-31', lastDay))).toBe('2026-11');
    expect(cycleMonth(payCycleOn('2026-10-11', { kind: 'sameDay', day: 25 }))).toBe('2026-10');
    // A payday on the 1st ends the cycle in the month just gone.
    expect(cycleMonth(payCycleOn('2026-10-01', { kind: 'sameDay', day: 1 }))).toBe('2026-10');
    expect(cycleMonth(payCycleOn('2026-10-15', { kind: 'sameDay', day: 1 }))).toBe('2026-10');
  });

  it('gives payday 15 a February and payday 16 no repeated month', () => {
    const labels = (day: number) => cyclesAcross({ kind: 'sameDay', day }, [2026]).map(cycleMonth);
    expect(labels(15)).toContain('2026-02');
    expect(new Set(labels(16)).size).toBe(12);
  });

  it('holds still on every day of a cycle', () => {
    const payday: Payday = { kind: 'sameDay', day: 25 };
    expect(cycleMonth(payCycleOn('2026-09-28', payday))).toBe(
      cycleMonth(payCycleOn('2026-10-05', payday)),
    );
  });

  it('gives every calendar month exactly one cycle, in order, for every payday and year', () => {
    // Runs of consecutive years: leap years (2024, 2028) and a century year that is not one (2100).
    const runs = [
      [2023, 2024, 2025, 2026, 2027, 2028, 2029],
      [2099, 2100, 2101],
    ];
    const bad = paydays.flatMap((payday) => runs.flatMap((years) => misnamed(payday, years)));
    expect(bad).toEqual([]);
  });
});
