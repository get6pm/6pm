import { describe, expect, it } from 'vitest';

import { cycleMonth, payCycleOn, type Payday } from './pay-cycle';
import {
  dueSetAsides,
  occasionsOf,
  potSetAside,
  potTotals,
  rebalanceShares,
  type PotMove,
  type PotTerms,
} from './pots';

const lastDay: Payday = { kind: 'lastDay' };
const dayOf = (instant: string) => instant.slice(0, 10);

const occasion = (over: Partial<PotTerms & { id: string; createdAt: string }> = {}) => ({
  id: 'japan',
  kind: 'occasion' as const,
  goal: 3_000_000,
  neededBy: '2026-12',
  share: null,
  paused: false,
  createdAt: '2026-10-11T03:00:00.000Z',
  ...over,
});

const goal = (over: Partial<PotTerms & { id: string; createdAt: string }> = {}) =>
  occasion({ id: 'cushion', kind: 'goal', goal: 5_000_000, neededBy: null, share: 0.5, ...over });

const run = (
  pots: ReturnType<typeof occasion>[],
  moves: PotMove[],
  today: string,
  payday: Payday = lastDay,
  futureYou = 2_000_000,
) => dueSetAsides({ pots, moves, futureYou, payday, today, dayOf });

describe('cycleMonth', () => {
  it('names the month most of the cycle lies in, whatever the payday', () => {
    expect(cycleMonth(payCycleOn('2026-10-11', lastDay))).toBe('2026-10');
    expect(cycleMonth(payCycleOn('2026-10-31', lastDay))).toBe('2026-11');
    expect(cycleMonth(payCycleOn('2026-10-11', { kind: 'sameDay', day: 25 }))).toBe('2026-10');
    expect(cycleMonth(payCycleOn('2026-10-01', { kind: 'sameDay', day: 1 }))).toBe('2026-10');
  });

  it('holds still across the 1st of a month in the middle of the cycle', () => {
    const payday: Payday = { kind: 'sameDay', day: 25 };
    expect(cycleMonth(payCycleOn('2026-09-28', payday))).toBe(
      cycleMonth(payCycleOn('2026-10-05', payday)),
    );
  });
});

describe('potSetAside', () => {
  const cycle = payCycleOn('2026-10-11', lastDay);

  it('spreads an occasion over the months to its date, from the cycle', () => {
    expect(potSetAside({ pot: occasion(), savedBefore: 0, futureYou: 0, cycle })).toBe(1_500_000);
  });

  it('does not change on the 1st: months left count from the cycle, not the calendar', () => {
    const payday: Payday = { kind: 'sameDay', day: 25 };
    const before = payCycleOn('2026-09-30', payday);
    const after = payCycleOn('2026-10-02', payday);
    const a = potSetAside({ pot: occasion(), savedBefore: 0, futureYou: 0, cycle: before });
    const b = potSetAside({ pot: occasion(), savedBefore: 0, futureYou: 0, cycle: after });
    expect(a).toBe(b);
  });

  it('is nothing for a pot that is full, paused, undated or past its month', () => {
    expect(potSetAside({ pot: occasion(), savedBefore: 3_000_000, futureYou: 0, cycle })).toBe(0);
    expect(
      potSetAside({ pot: occasion({ paused: true }), savedBefore: 0, futureYou: 0, cycle }),
    ).toBe(0);
    expect(
      potSetAside({ pot: occasion({ neededBy: null }), savedBefore: 0, futureYou: 0, cycle }),
    ).toBe(0);
    const late = payCycleOn('2027-01-15', lastDay);
    expect(
      potSetAside({ pot: occasion(), savedBefore: 1_000_000, futureYou: 0, cycle: late }),
    ).toBe(0);
  });

  it('takes the whole rest in the last month, not a whole goal again', () => {
    const last = payCycleOn('2026-12-10', lastDay);
    expect(
      potSetAside({ pot: occasion(), savedBefore: 1_500_000, futureYou: 0, cycle: last }),
    ).toBe(1_500_000);
  });

  it('gives a Future you goal its share of Future you until it is full', () => {
    expect(potSetAside({ pot: goal(), savedBefore: 0, futureYou: 2_000_000, cycle })).toBe(
      1_000_000,
    );
    expect(potSetAside({ pot: goal(), savedBefore: 4_500_000, futureYou: 2_000_000, cycle })).toBe(
      500_000,
    );
    expect(
      potSetAside({
        pot: goal({ neededBy: '2026-01' }),
        savedBefore: 0,
        futureYou: 2_000_000,
        cycle,
      }),
    ).toBe(1_000_000);
  });
});

describe('dueSetAsides', () => {
  it('records the pot in the cycle it was made, once', () => {
    const due = run([occasion()], [], '2026-10-11');
    expect(due).toEqual([{ potId: 'japan', cycle: '2026-09-30', amount: 1_500_000 }]);
    const moves: PotMove[] = due.map((d) => ({ ...d, kind: 'setAside' }));
    expect(run([occasion()], moves, '2026-10-11')).toEqual([]);
    expect(run([occasion()], moves, '2026-10-30')).toEqual([]);
  });

  it('writes the next cycle on payday, counting what the first one put in', () => {
    const first: PotMove[] = [
      { potId: 'japan', kind: 'setAside', cycle: '2026-09-30', amount: 1_500_000 },
    ];
    expect(run([occasion()], first, '2026-10-31')).toEqual([
      { potId: 'japan', cycle: '2026-10-31', amount: 1_500_000 },
    ]);
  });

  it('catches up every cycle a launch skipped, each counting the ones before it', () => {
    const first: PotMove[] = [
      { potId: 'japan', kind: 'setAside', cycle: '2026-09-30', amount: 1_500_000 },
    ];
    const due = run([occasion()], first, '2026-12-15');
    expect(due).toEqual([
      { potId: 'japan', cycle: '2026-10-31', amount: 1_500_000 },
      { potId: 'japan', cycle: '2026-11-30', amount: 0 },
    ]);
  });

  it('stops once the pot is full and after its month, with zeros that keep the cycles recorded', () => {
    const due = run([occasion({ goal: 1_000_000, neededBy: '2026-11' })], [], '2027-02-10');
    expect(due.map((d) => d.cycle)).toEqual([
      '2026-09-30',
      '2026-10-31',
      '2026-11-30',
      '2026-12-31',
      '2027-01-31',
    ]);
    expect(due.map((d) => d.amount)).toEqual([1_000_000, 0, 0, 0, 0]);
  });

  it('does not record the months before the pot was made', () => {
    const due = run([occasion({ createdAt: '2026-12-05T03:00:00.000Z' })], [], '2026-12-20');
    expect(due.map((d) => d.cycle)).toEqual(['2026-11-30']);
  });

  it('counts top-ups from earlier cycles but not the current one', () => {
    const moves: PotMove[] = [
      { potId: 'japan', kind: 'setAside', cycle: '2026-09-30', amount: 1_500_000 },
      { potId: 'japan', kind: 'topUp', cycle: '2026-09-30', amount: 500_000 },
      { potId: 'japan', kind: 'topUp', cycle: '2026-10-31', amount: 100_000 },
    ];
    // 3tr − 2tr held when the cycle began, with the one month left to November.
    const due = run([occasion({ neededBy: '2026-11' })], moves, '2026-10-31');
    expect(due).toEqual([{ potId: 'japan', cycle: '2026-10-31', amount: 1_000_000 }]);
  });

  it('fills Future you goals from Future you each cycle', () => {
    const due = run([goal({ createdAt: '2026-09-02T03:00:00.000Z' })], [], '2026-10-11');
    expect(due).toEqual([
      { potId: 'cushion', cycle: '2026-08-31', amount: 1_000_000 },
      { potId: 'cushion', cycle: '2026-09-30', amount: 1_000_000 },
    ]);
  });

  it('keeps the recorded cycles when the payday changes (the caller re-keys the current one)', () => {
    const payday: Payday = { kind: 'sameDay', day: 25 };
    const moves: PotMove[] = [
      { potId: 'japan', kind: 'setAside', cycle: '2026-09-25', amount: 1_500_000 },
    ];
    expect(run([occasion()], moves, '2026-10-11', payday)).toEqual([]);
    expect(run([occasion()], moves, '2026-10-25', payday)).toEqual([
      { potId: 'japan', cycle: '2026-10-25', amount: 1_500_000 },
    ]);
  });
});

describe('potTotals', () => {
  const moves: PotMove[] = [
    { potId: 'japan', kind: 'setAside', cycle: '2026-09-30', amount: 1_000_000 },
    { potId: 'japan', kind: 'setAside', cycle: '2026-10-31', amount: 500_000 },
    { potId: 'japan', kind: 'topUp', cycle: '2026-10-31', amount: 100_000 },
    { potId: 'cushion', kind: 'setAside', cycle: '2026-10-31', amount: 700_000 },
    { potId: 'gone', kind: 'topUp', cycle: '2026-10-31', amount: 900_000 },
  ];

  it('adds each pot up and the cycle apart, leaving out pots that were deleted', () => {
    const totals = potTotals(moves, new Set(['japan', 'cushion']), '2026-10-31');
    expect(totals.saved).toEqual({ japan: 1_600_000, cushion: 700_000 });
    expect(totals.setAside).toEqual({ japan: 500_000, cushion: 700_000 });
    expect(totals.topUps).toBe(100_000);
  });

  it('counts only occasion pots in the daily number', () => {
    const totals = potTotals(moves, new Set(['japan', 'cushion']), '2026-10-31');
    const pots = [
      { id: 'japan', kind: 'occasion' as const },
      { id: 'cushion', kind: 'goal' as const },
    ];
    expect(occasionsOf(pots, totals.setAside)).toBe(500_000);
  });
});

describe('rebalanceShares', () => {
  it('gives a lone goal all of Future you', () => {
    expect(rebalanceShares({ a: 0.3 }, 'a')).toEqual({ a: 1 });
    expect(rebalanceShares({})).toEqual({});
  });

  it('keeps the share just set and shrinks the others in proportion', () => {
    expect(rebalanceShares({ a: 0.6, b: 0.4, c: 0.5 }, 'c')).toEqual({ a: 0.3, b: 0.2, c: 0.5 });
  });

  it('splits what is left evenly when the others had no share', () => {
    expect(rebalanceShares({ a: 1, b: 0 }, 'b')).toEqual({ a: 1, b: 0 });
    expect(rebalanceShares({ a: 0, b: 0, c: 0.4 }, 'c')).toEqual({ a: 0.3, b: 0.3, c: 0.4 });
  });

  it('scales every share to one when a goal goes away, and always adds up to one', () => {
    expect(rebalanceShares({ a: 0.6, b: 0.4 })).toEqual({ a: 0.6, b: 0.4 });
    expect(rebalanceShares({ a: 0.3, b: 0.2 })).toEqual({ a: 0.6, b: 0.4 });
    const split = rebalanceShares({ a: 0.5, b: 0.5, c: 0.5 }, 'c');
    expect(Object.values(split).reduce((x, y) => x + y, 0)).toBeCloseTo(1, 10);
  });
});
