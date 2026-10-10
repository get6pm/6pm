import { describe, expect, it } from 'vitest';

import {
  calendarCells,
  dayDot,
  daysOfMonth,
  monthGrid,
  nextMonthStart,
  previousMonth,
  underCount,
} from './calendar';

describe('monthGrid', () => {
  it('lays October 2026 out Monday-first: 1 Oct is a Thursday, 35 cells', () => {
    const grid = monthGrid('2026-10');
    expect(grid).toHaveLength(35);
    expect(grid.slice(0, 3)).toEqual([null, null, null]);
    expect(grid[3]).toBe('2026-10-01');
    expect(grid[33]).toBe('2026-10-31');
    expect(grid[34]).toBeNull();
    // The design's Friday 9 October sits in the second row, fifth column.
    expect(grid.indexOf('2026-10-09')).toBe(7 + 4);
  });

  it('takes six weeks when the month needs them (August 2026 starts on a Saturday)', () => {
    const grid = monthGrid('2026-08');
    expect(grid).toHaveLength(42);
    expect(grid[5]).toBe('2026-08-01');
    expect(grid[35]).toBe('2026-08-31');
  });

  it('never drops below five weeks (February 2027 fills exactly four)', () => {
    const grid = monthGrid('2027-02');
    expect(grid).toHaveLength(35);
    expect(grid[0]).toBe('2027-02-01');
    expect(grid[27]).toBe('2027-02-28');
    expect(grid.slice(28).every((c) => c === null)).toBe(true);
  });
});

describe('month helpers', () => {
  it('knows month lengths, the binding day and the month before', () => {
    expect(daysOfMonth('2028-02')).toHaveLength(29);
    expect(nextMonthStart('2026-10')).toBe('2026-11-01');
    expect(nextMonthStart('2026-12')).toBe('2027-01-01');
    expect(previousMonth('2027-01')).toBe('2026-12');
  });
});

describe('dayDot', () => {
  it('is green at or under the line and orange over it', () => {
    expect(dayDot(330_000, 351_000)).toBe('under');
    expect(dayDot(351_000, 351_000)).toBe('under');
    expect(dayDot(352_000, 351_000)).toBe('over');
    expect(dayDot(0, 0)).toBe('under');
  });
});

describe('calendarCells', () => {
  const line = 351_000;
  const closed = [
    { day: '2026-10-01', spent: 312_000, line },
    { day: '2026-10-03', spent: 455_000, line },
    { day: '2026-10-08', spent: 330_000, line },
  ];

  it('marks closed, today, missed and idle days as the design does', () => {
    const cells = calendarCells({
      month: '2026-10',
      today: '2026-10-09',
      closed,
      since: '2026-10-01',
    });
    const at = (day: string) => cells.find((c) => c.kind !== 'blank' && c.day === day);
    expect(cells.filter((c) => c.kind === 'blank')).toHaveLength(4);
    expect(at('2026-10-01')).toEqual({
      kind: 'closed',
      day: '2026-10-01',
      spent: 312_000,
      dot: 'under',
    });
    expect(at('2026-10-03')).toMatchObject({ kind: 'closed', dot: 'over' });
    expect(at('2026-10-07')).toEqual({ kind: 'missed', day: '2026-10-07' });
    expect(at('2026-10-09')).toEqual({ kind: 'today', day: '2026-10-09' });
    expect(at('2026-10-10')).toEqual({ kind: 'idle', day: '2026-10-10' });
  });

  it('shows today as closed once it is', () => {
    const cells = calendarCells({
      month: '2026-10',
      today: '2026-10-09',
      closed: [...closed, { day: '2026-10-09', spent: 302_000, line }],
      since: '2026-10-01',
    });
    expect(cells.find((c) => c.kind !== 'blank' && c.day === '2026-10-09')?.kind).toBe('closed');
  });

  it('never calls a day missed before the user started', () => {
    const cells = calendarCells({
      month: '2026-10',
      today: '2026-10-09',
      closed: [],
      since: '2026-10-08',
    });
    const kinds = cells.flatMap((c) => (c.kind === 'blank' ? [] : [[c.day.slice(8), c.kind]]));
    expect(kinds.slice(0, 9)).toEqual([
      ['01', 'idle'],
      ['02', 'idle'],
      ['03', 'idle'],
      ['04', 'idle'],
      ['05', 'idle'],
      ['06', 'idle'],
      ['07', 'idle'],
      ['08', 'missed'],
      ['09', 'today'],
    ]);
    const fresh = calendarCells({ month: '2026-10', today: '2026-10-09', closed: [], since: null });
    expect(fresh.some((c) => c.kind === 'missed')).toBe(false);
  });

  it('counts the days under their own line', () => {
    expect(underCount(closed)).toBe(2);
  });
});
