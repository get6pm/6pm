import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { currencyOf } from '../money/currency';
import { addDays } from '../time/local-date';
import { cycleFutureYou, dailyNumber, type DailyNumberInput } from './daily-number';
import {
  futureYouStartsOn,
  joinedCycle,
  spentSincePaydayEstimate,
  spentSincePaydayPresets,
} from './joined-cycle';
import { joinedShare, payCycleOn } from './pay-cycle';
import { aboutPerDay, moneyRiver } from './plan-river';
import { dueSetAsides, potSetAside } from './pots';

const payday31 = { kind: 'sameDay', day: 31 } as const;
const plan = {
  income: 15_000_000,
  bills: 5_000_000,
  futureYou: 2_000_000,
  occasions: 0,
  topUps: 0,
};

function firstDay(answer: number | null, extra: Partial<DailyNumberInput> = {}) {
  const cycle = payCycleOn('2026-10-20', payday31);
  const joined = joinedCycle(cycle, { on: '2026-10-20', spentSincePayday: answer });
  return dailyNumber({
    plan,
    spentBefore: 0,
    today: [],
    notDaily: new Set(),
    daysLeft: cycle.daysLeft,
    share: joined.share,
    beforeJoining: joined.beforeJoining,
    futureYouSkipped: joined.futureYouSkipped,
    ...extra,
  });
}

describe('spent since payday', () => {
  it('counts the answer in place of the estimate: (15 − 5 − 2 − 6)tr over 12 days', () => {
    const day = firstDay(6_000_000);
    expect(day.startFree).toBe(2_000_000);
    expect(day.line).toBe(166_000);
    expect(day.overspent).toBe(false);
  });

  it('starts the cycle overspent when the answer is more than the free money', () => {
    const day = firstDay(9_000_000);
    expect(day.startFree).toBe(-1_000_000);
    expect(day.line).toBe(0);
    expect(day.overspent).toBe(true);
  });

  it('gives exactly the estimate’s numbers when there is no answer', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200_000_000 }),
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.integer({ min: 0, max: 50_000_000 }),
        fc.integer({ min: 0, max: 50_000_000 }),
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 1, max: 31 }),
        (income, bills, futureYou, occasions, joinedAt, todayAt, day) => {
          const payday = { kind: 'sameDay', day } as const;
          const on = addDays('2026-01-01', joinedAt);
          const cycle = payCycleOn(addDays(on, todayAt % 60), payday);
          const joined = joinedCycle(cycle, { on, spentSincePayday: null });
          const base = {
            plan: { income, bills, futureYou, occasions, topUps: 0 },
            spentBefore: 0,
            today: [],
            notDaily: new Set<string>(),
            daysLeft: cycle.daysLeft,
          };
          const before = dailyNumber({ ...base, share: joinedShare(cycle, on) });
          const after = dailyNumber({
            ...base,
            share: joined.share,
            beforeJoining: joined.beforeJoining,
            futureYouSkipped: joined.futureYouSkipped,
          });
          expect(after).toEqual(before);
        },
      ),
    );
  });

  it('leaves every later cycle whole, answer or not', () => {
    const later = payCycleOn('2026-11-05', payday31);
    const joined = joinedCycle(later, {
      on: '2026-10-20',
      spentSincePayday: 6_000_000,
      futureYouAtPayday: true,
    });
    expect(joined).toEqual({
      joined: false,
      share: 1,
      beforeJoining: null,
      futureYouSkipped: false,
    });
  });

  it('treats joining on payday as a whole cycle', () => {
    const cycle = payCycleOn('2026-10-31', payday31);
    expect(joinedCycle(cycle, { on: '2026-10-31', spentSincePayday: 1 }).joined).toBe(false);
  });

  it('draws the answer as the river’s "before you joined" segment', () => {
    const day = firstDay(6_000_000);
    const river = moneyRiver({
      income: plan.income,
      bills: plan.bills,
      futureYou: plan.futureYou,
      occasions: 0,
      goalTopUps: 0,
      occasionTopUps: 0,
      free: day.free,
      beforeJoining: 6_000_000,
    });
    expect(river.before).toBe(6_000_000);
    expect(river.spent).toBe(0);
    expect(river.free).toBe(2_000_000);
  });
});

describe('the prefill', () => {
  it('is what the estimate takes as gone, so leaving it changes nothing', () => {
    const cycle = payCycleOn('2026-10-20', payday31);
    const share = joinedShare(cycle, '2026-10-20');
    // 30 Sep → 31 Oct is 32 days; 20 had gone by the 20th: 8tr × 20/32.
    expect(spentSincePaydayEstimate(8_000_000, share)).toBe(5_000_000);
    expect(spentSincePaydayEstimate(7_000_000, share)).toBe(4_375_000);
    expect(spentSincePaydayEstimate(7_000_001, share)).toBe(4_375_000);
    expect(spentSincePaydayEstimate(-1_000_000, share)).toBe(0);
    expect(spentSincePaydayEstimate(80_050, 0.5, currencyOf('USD'))).toBe(40_000);
  });

  it('offers the estimate and quarters of the free money, smallest first', () => {
    expect(spentSincePaydayPresets(8_000_000, 4_375_000)).toEqual([
      2_000_000, 4_000_000, 4_375_000, 6_000_000,
    ]);
    expect(spentSincePaydayPresets(8_000_000, 4_000_000)).toEqual([
      2_000_000, 4_000_000, 6_000_000,
    ]);
    expect(spentSincePaydayPresets(-5, 0)).toEqual([]);
  });
});

describe('Start Future you at payday', () => {
  it('skips Future you in the joined cycle only', () => {
    const day = firstDay(9_000_000, { futureYouSkipped: true });
    // (15 − 5 − 9)tr over 12 days: no longer overspent.
    expect(day.startFree).toBe(1_000_000);
    expect(day.overspent).toBe(false);
  });

  it('prices a goal at nothing a day while the joined cycle skips Future you', () => {
    const input = { plan, futureYouSkipped: true };
    expect(cycleFutureYou(input)).toBe(0);
    expect(cycleFutureYou({ plan })).toBe(2_000_000);
    const cycle = payCycleOn('2026-10-20', payday31);
    const goal = {
      kind: 'goal',
      goal: 50_000_000,
      neededBy: null,
      share: 1,
      paused: false,
    } as const;
    const thisCycle = potSetAside({
      pot: goal,
      savedBefore: 0,
      futureYou: cycleFutureYou(input),
      cycle,
    });
    expect(aboutPerDay(thisCycle, cycle.daysLeft)).toBe(0);
  });

  it('starts on the payday that ends the joined cycle', () => {
    expect(futureYouStartsOn(payday31, { on: '2026-10-20', futureYouAtPayday: true })).toBe(
      '2026-10-31',
    );
    expect(futureYouStartsOn(payday31, { on: '2026-10-20', futureYouAtPayday: false })).toBeNull();
    expect(futureYouStartsOn(payday31, { on: '2026-10-31', futureYouAtPayday: true })).toBeNull();
  });

  it('sets nothing aside for goals in the skipped cycle, then the whole share after', () => {
    const due = dueSetAsides({
      pots: [
        {
          id: 'g',
          kind: 'goal',
          goal: 100_000_000,
          neededBy: null,
          share: 1,
          paused: false,
          createdAt: '2026-10-20T03:00:00.000Z',
        },
      ],
      moves: [],
      futureYou: 2_000_000,
      futureYouFrom: '2026-10-31',
      payday: payday31,
      today: '2026-11-02',
      dayOf: (instant) => instant.slice(0, 10),
    });
    expect(due).toEqual([
      { potId: 'g', cycle: '2026-09-30', amount: 0 },
      { potId: 'g', cycle: '2026-10-31', amount: 2_000_000 },
    ]);
  });
});
