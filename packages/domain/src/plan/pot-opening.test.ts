import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { dailyNumber } from './daily-number';
import { payCycleOn, type Payday } from './pay-cycle';
import {
  dueSetAsides,
  occasionsOf,
  openingOf,
  potSetAside,
  potTotals,
  savedBefore,
  withOpening,
  type PotMove,
} from './pots';

const lastDay: Payday = { kind: 'lastDay' };
const today = '2026-10-11';
const cycle = payCycleOn(today, lastDay);
const dayOf = (instant: string) => instant.slice(0, 10);

const wedding = {
  id: 'wedding',
  kind: 'occasion' as const,
  goal: 50_000_000,
  neededBy: '2027-08',
  share: null,
  paused: false,
  createdAt: '2026-10-11T03:00:00.000Z',
};

const opening = (amount: number, at = cycle.start): PotMove => ({
  potId: 'wedding',
  kind: 'opening',
  cycle: at,
  amount,
});

/**
 * Today's number the way the phone works it out: the cycle's set-asides from the moves, then the
 * cycle's totals, then the line.
 */
function numberOf(moves: readonly PotMove[]) {
  const due = dueSetAsides({ pots: [wedding], moves, futureYou: 0, payday: lastDay, today, dayOf });
  const all = [...moves, ...due.map((d): PotMove => ({ ...d, kind: 'setAside' }))];
  const totals = potTotals(all, new Set(['wedding']), cycle.start);
  return dailyNumber({
    plan: {
      income: 40_000_000,
      bills: 5_000_000,
      futureYou: 0,
      occasions: occasionsOf([wedding], totals.setAside),
      topUps: totals.topUps,
    },
    spentBefore: 0,
    today: [],
    notDaily: new Set(),
    daysLeft: 20,
  });
}

describe('opening pot moves', () => {
  it('lowers the monthly need: 50tr in 10 months with 20tr already saved is 3tr a month', () => {
    const before = savedBefore([opening(20_000_000)], 'wedding', cycle.start);
    expect(before).toBe(20_000_000);
    expect(potSetAside({ pot: wedding, savedBefore: before, futureYou: 0, cycle })).toBe(3_000_000);
    expect(potSetAside({ pot: wedding, savedBefore: 0, futureYou: 0, cycle })).toBe(5_000_000);
  });

  it('rounds the set-aside up to a fifty step', () => {
    const before = savedBefore([opening(20_010_000)], 'wedding', cycle.start);
    expect(potSetAside({ pot: wedding, savedBefore: before, futureYou: 0, cycle })).toBe(3_000_000);
    const odd = savedBefore([opening(19_990_000)], 'wedding', cycle.start);
    expect(potSetAside({ pot: wedding, savedBefore: odd, futureYou: 0, cycle })).toBe(3_050_000);
  });

  it('counts as saved before the cycle whenever it was typed, later cycles included', () => {
    const typedLater = opening(20_000_000, '2027-03-31');
    expect(savedBefore([typedLater], 'wedding', cycle.start)).toBe(20_000_000);
    const due = dueSetAsides({
      pots: [wedding],
      moves: [typedLater],
      futureYou: 0,
      payday: lastDay,
      today,
      dayOf,
    });
    expect(due).toEqual([{ potId: 'wedding', cycle: cycle.start, amount: 3_000_000 }]);
  });

  it('counts in what the pot holds and never in the cycle’s top-ups or set-asides', () => {
    const totals = potTotals([opening(20_000_000)], new Set(['wedding']), cycle.start);
    expect(totals.saved).toEqual({ wedding: 20_000_000 });
    expect(totals.topUps).toBe(0);
    expect(totals.setAside).toEqual({});
  });

  it('keeps today’s number where it was: typing it is never a top-up out of free money', () => {
    const without = numberOf([]);
    const typed = numberOf([opening(20_000_000)]);
    // The set-aside shrinks from 5tr to 3tr; the 20tr itself takes nothing from the cycle.
    expect(typed.startFree - without.startFree).toBe(2_000_000);
    expect(typed.line).toBeGreaterThanOrEqual(without.line);
    const asTopUp = numberOf([{ ...opening(20_000_000), kind: 'topUp' }]);
    expect(asTopUp.line).toBeLessThan(without.line);
  });

  it('is read as the one amount the pot started with', () => {
    expect(openingOf([opening(20_000_000)], 'wedding')).toBe(20_000_000);
    expect(openingOf([{ ...opening(1), kind: 'topUp' }], 'wedding')).toBe(0);
    expect(openingOf([opening(5)], 'other')).toBe(0);
  });

  it('replaces the one opening when it is edited, never adding a second', () => {
    const moves = [opening(20_000_000), { ...opening(3_000_000), kind: 'setAside' as const }];
    expect(withOpening(23_000_000, moves, 'wedding', 25_000_000)).toBe(28_000_000);
    expect(withOpening(23_000_000, moves, 'wedding', 0)).toBe(3_000_000);
    expect(withOpening(3_000_000, [], 'wedding', 20_000_000)).toBe(23_000_000);
  });

  it('never changes the daily number for the same set-asides, whatever the amount', () => {
    const move = fc.record({
      potId: fc.constantFrom('wedding', 'gone'),
      kind: fc.constantFrom('setAside' as const, 'topUp' as const, 'spent' as const),
      cycle: fc.constantFrom('2026-08-31', '2026-09-30', cycle.start),
      amount: fc.integer({ min: -5_000_000, max: 50_000_000 }),
    });
    fc.assert(
      fc.property(
        fc.array(move, { maxLength: 12 }),
        fc.integer({ min: 0, max: 2_000_000_000 }),
        fc.constantFrom('2026-08-31', cycle.start, '2027-01-31'),
        (moves, amount, at) => {
          const line = (all: readonly PotMove[]) => {
            const totals = potTotals(all, new Set(['wedding']), cycle.start);
            return dailyNumber({
              plan: {
                income: 40_000_000,
                bills: 5_000_000,
                futureYou: 0,
                occasions: occasionsOf([wedding], totals.setAside),
                topUps: totals.topUps,
              },
              spentBefore: 0,
              today: [],
              notDaily: new Set(),
              daysLeft: 20,
            });
          };
          expect(line([...moves, opening(amount, at)])).toEqual(line(moves));
        },
      ),
    );
  });

  it('never lowers today’s number once the set-asides are worked out again', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 80_000_000 }), (amount) => {
        expect(numberOf([opening(amount)]).line).toBeGreaterThanOrEqual(numberOf([]).line);
      }),
    );
  });
});
