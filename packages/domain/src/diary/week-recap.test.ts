import { describe, expect, it } from 'vitest';

import { diaryShelf, longestRun, monthDiary } from './month-diary';
import { topPlaces, weekRecap, type DiarySpend } from './week-recap';

const line = 351_000;
const spend = (
  day: string,
  merchant: string,
  amount: number,
  category = 'food',
  status: DiarySpend['status'] = 'kept',
): DiarySpend => ({ day, merchant, amount, category, status });

describe('weekRecap', () => {
  // The design's week: Mon 5 – Fri 9 Oct, Wednesday never closed, 302k counted so far today.
  const closed = [
    { day: '2026-10-05', spent: 280_000, line },
    { day: '2026-10-06', spent: 410_000, line },
    { day: '2026-10-08', spent: 330_000, line },
  ];
  const spends = [
    spend('2026-10-05', 'Phở Hòa', 45_000),
    spend('2026-10-06', 'Circle K', 65_000, 'shopping'),
    spend('2026-10-08', 'Phở Hòa', 45_000),
    spend('2026-10-08', 'Circle K', 120_000, 'shopping'),
    spend('2026-10-09', 'Phở Hòa', 45_000, 'food', 'pending'),
    spend('2026-10-09', 'Highlands Coffee', 59_000, 'drinks', 'caught'),
    spend('2026-10-09', 'Not me', 200_000, 'food', 'skipped'),
    spend('2026-10-09', 'Rent', 3_500_000, 'home'),
  ];
  const recap = weekRecap({
    today: '2026-10-09',
    line,
    closed,
    spends,
    notDaily: new Set(['home']),
  });

  it('draws a bar per day on the design scale, with the line at 49%', () => {
    expect(recap.from).toBe('2026-10-05');
    expect(recap.lineHeight).toBe(49);
    expect(recap.bars.map((b) => b.height)).toEqual([39, 57, 5, 46, 15, 0, 0]);
    expect(recap.bars.map((b) => b.value)).toEqual([
      280_000,
      410_000,
      0,
      330_000,
      104_000,
      null,
      null,
    ]);
    expect(recap.bars.map((b) => b.over)).toEqual([false, true, false, false, false, false, false]);
    expect(recap.bars[4]?.isToday).toBe(true);
  });

  it('adds up the week so far and the days under the line', () => {
    expect(recap.total).toBe(280_000 + 410_000 + 330_000 + 104_000);
    expect(recap.days).toBe(5);
    expect(recap.under).toBe(4);
  });

  it('tells the story of the closed days only', () => {
    expect(recap.story).toEqual({ kind: 'under', days: 2, spare: 71_000 - 59_000 + 21_000 });
    const over = weekRecap({
      today: '2026-10-09',
      line,
      closed: [{ day: '2026-10-06', spent: 451_000, line }],
      spends: [],
      notDaily: new Set(),
    });
    expect(over.story).toEqual({ kind: 'over', over: 100_000 });
    const fresh = weekRecap({
      today: '2026-10-05',
      line,
      closed: [],
      spends: [],
      notDaily: new Set(),
    });
    expect(fresh.story).toEqual({ kind: 'fresh' });
    expect(fresh.days).toBe(1);
  });

  it('rescales so a big day still fits', () => {
    const big = weekRecap({
      today: '2026-10-06',
      line,
      closed: [{ day: '2026-10-05', spent: 1_000_000, line }],
      spends: [],
      notDaily: new Set(),
    });
    expect(big.bars[0]?.height).toBe(70);
    expect(big.lineHeight).toBe(25);
  });
});

describe('topPlaces', () => {
  it('groups merchants by name, counted spends only, biggest first', () => {
    const places = topPlaces(
      [
        spend('2026-10-05', 'Phở Hòa', 45_000),
        spend('2026-10-06', 'phở hòa ', 45_000),
        spend('2026-10-06', 'Circle K', 120_000, 'shopping'),
        spend('2026-10-07', 'Grab', 300_000, 'transport', 'skipped'),
        spend('2026-10-07', 'Highlands', 59_000, 'drinks'),
        spend('2026-10-07', 'Cơm', 10_000),
      ],
      new Set(),
    );
    expect(places).toEqual([
      { merchant: 'Circle K', category: 'shopping', visits: 1, amount: 120_000 },
      { merchant: 'Phở Hòa', category: 'food', visits: 2, amount: 90_000 },
      { merchant: 'Highlands', category: 'drinks', visits: 1, amount: 59_000 },
    ]);
  });
});

describe('monthDiary', () => {
  it('adds up a month, finds its quietest and biggest days and its longest run', () => {
    const closed = [
      { day: '2026-09-01', spent: 300_000, line: 340_000 },
      { day: '2026-09-02', spent: 85_000, line: 340_000 },
      { day: '2026-09-03', spent: 1_200_000, line: 340_000 },
      { day: '2026-09-05', spent: 200_000, line: 340_000 },
      { day: '2026-10-01', spent: 1, line: 1 },
    ];
    const diary = monthDiary({ month: '2026-09', closed, spends: [], notDaily: new Set() });
    expect(diary.days).toBe(30);
    expect(diary.closed).toHaveLength(4);
    expect(diary.spent).toBe(1_785_000);
    expect(diary.plan).toBe(1_360_000);
    expect(diary.spare).toBe(-425_000);
    expect(diary.under).toBe(3);
    expect(diary.run).toEqual({ days: 3, from: '2026-09-01', to: '2026-09-03' });
    expect(diary.quietest?.day).toBe('2026-09-02');
    expect(diary.biggest?.day).toBe('2026-09-03');
    expect(diary.dots.filter(Boolean)).toHaveLength(4);
  });

  it('finds runs across gaps', () => {
    expect(longestRun([])).toBeNull();
    expect(longestRun(['2026-08-04', '2026-08-01', '2026-08-05', '2026-08-06'])).toEqual({
      days: 3,
      from: '2026-08-04',
      to: '2026-08-06',
    });
  });
});

describe('diaryShelf', () => {
  it('puts this month first, in progress, then earlier months with closed days, numbered from the first', () => {
    const shelf = diaryShelf('2026-10-09', [
      { month: '2026-08', closed: 24, spent: 9_600_000, line: 9_400_000 },
      { month: '2026-09', closed: 27, spent: 8_900_000, line: 9_200_000 },
      { month: '2026-10', closed: 7, spent: 2_000_000, line: 2_400_000 },
    ]);
    expect(shelf.map((d) => [d.month, d.no, d.inProgress])).toEqual([
      ['2026-10', 3, true],
      ['2026-09', 2, false],
      ['2026-08', 1, false],
    ]);
    expect(shelf[0]?.binds).toBe('2026-11-01');
    expect(shelf[1]?.spare).toBe(300_000);
    expect(shelf[2]?.spare).toBe(-200_000);
  });

  it('shows this month even before anything is closed', () => {
    expect(diaryShelf('2026-10-09', [])).toMatchObject([
      { month: '2026-10', no: 1, closed: 0, days: 31 },
    ]);
  });
});
