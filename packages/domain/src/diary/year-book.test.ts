import { describe, expect, it } from 'vitest';

import { monthDiary } from './month-diary';
import {
  daysOfYear,
  monthsOfYear,
  yearBookBound,
  yearBookMonths,
  yearBookShelf,
  yearSummary,
} from './year-book';

const line = 340_000;
const diary = (month: string, days: readonly [string, number][]) =>
  monthDiary({
    month,
    closed: days.map(([day, spent]) => ({ day: `${month}-${day}`, spent, line })),
    spends: [],
    notDaily: new Set(),
  });

describe('yearBookBound', () => {
  it('binds on 31 December, not a day before', () => {
    expect(yearBookBound('2026-12-30', '2026')).toBe(false);
    expect(yearBookBound('2026-12-31', '2026')).toBe(true);
    expect(yearBookBound('2027-01-01', '2026')).toBe(true);
  });
});

describe('yearBookShelf', () => {
  const totals = [
    { month: '2024-11', closed: 4, spent: 1, line: 1 },
    { month: '2025-03', closed: 0, spent: 0, line: 0 },
    { month: '2025-12', closed: 9, spent: 1, line: 1 },
    { month: '2026-01', closed: 20, spent: 1, line: 1 },
  ];

  it('puts this year first, waiting, then each earlier year with a closed day, bound', () => {
    expect(yearBookShelf('2026-10-09', totals)).toEqual([
      { year: '2026', bound: false },
      { year: '2025', bound: true },
      { year: '2024', bound: true },
    ]);
  });

  it('binds this year on 31 December', () => {
    expect(yearBookShelf('2026-12-31', [])).toEqual([{ year: '2026', bound: true }]);
  });

  it('leaves out a year whose months have no closed day', () => {
    const quiet = [{ month: '2025-03', closed: 0, spent: 0, line: 0 }];
    expect(yearBookShelf('2026-02-01', quiet)).toEqual([{ year: '2026', bound: false }]);
  });
});

describe('monthsOfYear and daysOfYear', () => {
  it('lists twelve months and counts leap years', () => {
    expect(monthsOfYear('2026')).toHaveLength(12);
    expect(monthsOfYear('2026')[0]).toBe('2026-01');
    expect(monthsOfYear('2026')[11]).toBe('2026-12');
    expect(daysOfYear('2026')).toBe(365);
    expect(daysOfYear('2028')).toBe(366);
    expect(daysOfYear('2100')).toBe(365);
  });
});

describe('yearBookMonths', () => {
  it('keeps the year’s months with a closed day, January first', () => {
    const months = yearBookMonths('2026', [
      diary('2026-03', [['02', 100_000]]),
      diary('2026-01', [['05', 100_000]]),
      diary('2026-02', []),
      diary('2025-12', [['31', 100_000]]),
    ]);
    expect(months.map((m) => m.month)).toEqual(['2026-01', '2026-03']);
  });
});

describe('yearSummary', () => {
  const diaries = [
    diary('2026-01', [
      ['30', 300_000],
      ['31', 400_000],
    ]),
    diary('2026-02', [
      ['01', 200_000],
      ['02', 340_000],
      ['10', 500_000],
    ]),
    diary('2025-12', [['31', 1_000_000]]),
  ];

  it('adds up the year’s closed days, spending and plan', () => {
    const summary = yearSummary('2026', diaries, { '2026-01': 2_000_000, '2026-02': 1_500_000 });
    expect(summary.closed).toBe(5);
    expect(summary.days).toBe(365);
    expect(summary.spent).toBe(1_740_000);
    expect(summary.plan).toBe(5 * line);
    expect(summary.spare).toBe(5 * line - 1_740_000);
    expect(summary.under).toBe(3);
    expect(summary.saved).toBe(3_500_000);
  });

  it('runs the longest streak across a month end', () => {
    expect(yearSummary('2026', diaries).run).toEqual({
      days: 4,
      from: '2026-01-30',
      to: '2026-02-02',
    });
  });

  it('lists each month for the contents page', () => {
    expect(yearSummary('2026', diaries).lines).toEqual([
      { month: '2026-01', closed: 2, days: 31, spare: 2 * line - 700_000 },
      { month: '2026-02', closed: 3, days: 28, spare: 3 * line - 1_040_000 },
    ]);
  });

  it('is empty for a year with no closed day', () => {
    const summary = yearSummary('2027', diaries);
    expect(summary.closed).toBe(0);
    expect(summary.run).toBeNull();
    expect(summary.lines).toEqual([]);
  });
});
