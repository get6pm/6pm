import { describe, expect, it } from '@jest/globals';

import { dailyNumber, payCycleOn, type BillRow, type PotRow } from '@6pm/domain';

import type { MoneySnapshot } from '../../data/money-store';
import {
  barDays,
  billViews,
  goalViews,
  occasionViews,
  occasionsMonthly,
  riverOf,
  shareSplit,
  sliderMax,
  stepPotMonth,
  potMonthAt,
} from './plan-view';

const today = '2026-10-09';
const cycle = payCycleOn(today, { kind: 'sameDay', day: 31 });
const at = '2026-10-01T00:00:00.000Z';

const bill = (id: string, amount: number, dueDay: number, paid: boolean): BillRow => ({
  id,
  name: id,
  icon: 'home',
  hue: 30,
  amount,
  dueDay,
  paidCycle: paid ? cycle.start : null,
  sort: 0,
  archivedAt: null,
});

const pot = (p: Partial<PotRow> & Pick<PotRow, 'id' | 'kind' | 'goal'>): PotRow => ({
  name: p.id,
  icon: 'celebration',
  hue: 20,
  neededBy: null,
  share: null,
  paused: false,
  createdAt: at,
  archivedAt: null,
  ...p,
});

/** The prototype's Friday: four bills (rent and phone paid), two goals, three occasions. */
const snap: MoneySnapshot = {
  today,
  plan: {
    income: 17_400_000,
    payday: { kind: 'sameDay', day: 31 },
    futureYou: 2_000_000,
    closeAt: '18:00',
    persona: 'cheeky',
    serious: false,
  },
  cycle,
  categories: [],
  cycleSpends: [],
  bills: [
    bill('rent', 3_500_000, 1, true),
    bill('phone', 100_000, 3, true),
    bill('net', 220_000, 12, false),
    bill('power', 380_000, 15, false),
  ],
  pots: [
    pot({ id: 'japan', kind: 'goal', goal: 6_000_000, share: 0.6, neededBy: '2027-03' }),
    pot({ id: 'cushion', kind: 'goal', goal: 15_000_000, share: 0.4 }),
    pot({ id: 'tet', kind: 'occasion', goal: 3_000_000, neededBy: '2027-02' }),
    pot({ id: 'wedding', kind: 'occasion', goal: 500_000, neededBy: '2026-10' }),
    pot({ id: 'dalat', kind: 'occasion', goal: 4_000_000, neededBy: '2027-01' }),
  ],
  potSaved: { japan: 3_600_000, cushion: 5_000_000, tet: 1_200_000, wedding: 500_000 },
  topUpsThisCycle: 0,
  closedDays: [],
};

describe('plan view', () => {
  it('reads the bills against the cycle: paid ones, days to go, place on the line', () => {
    const views = billViews(snap);
    expect(views.map((v) => v.paid)).toEqual([true, true, false, false]);
    expect(views[2]).toMatchObject({ due: '2026-10-12', inDays: 3 });
    expect(views[0]?.inDays).toBe(-8);
    expect(views[2]?.position).toBeCloseTo(11 / 30);
  });

  it('puts every pot at its designed pace', () => {
    expect(occasionViews(snap).map((o) => [o.monthly, o.full])).toEqual([
      [450_000, false],
      [0, true],
      [1_350_000, false],
    ]);
    expect(occasionsMonthly(snap)).toBe(1_800_000);
    const goals = goalViews(snap);
    expect(goals.map((g) => g.plan.status)).toEqual(['onTrack', 'steady']);
    expect(goals[0]?.progress).toBeCloseTo(0.6);
    expect(shareSplit(goals)).toBe('60 / 40');
  });

  it('builds the river so it adds up to the income', () => {
    const day = dailyNumber({
      plan: {
        income: 17_400_000,
        bills: 4_200_000,
        futureYou: 2_000_000,
        occasions: 1_800_000,
        topUps: 0,
      },
      spentBefore: 2_365_000,
      today: [],
      notDaily: new Set(),
      daysLeft: cycle.daysLeft,
    });
    const river = riverOf(snap, day, { goal: 0, occasion: 0 });
    expect(river.bills).toBe(4_200_000);
    expect(river.spent).toBe(2_365_000);
    expect(Object.values(river).reduce((a, b) => a + b, 0)).toBe(17_400_000);
  });

  it('draws a bar from today through payday, weekends marked', () => {
    const days = barDays(today, cycle.payday);
    expect(days).toHaveLength(23);
    expect(days[0]).toEqual({ day: today, isToday: true, weekend: false });
    expect(days.slice(1, 3).map((d) => d.weekend)).toEqual([true, true]);
    expect(days[22]?.day).toBe('2026-10-31');
  });

  it('keeps the slider on 250k steps up to 4tr, or the plan if it is higher', () => {
    expect(sliderMax(2_000_000)).toBe(4_000_000);
    expect(sliderMax(5_100_000)).toBe(5_250_000);
  });

  it('steps "Needed by" through the designed months and "No date"', () => {
    expect(stepPotMonth(3, 1)).toBe(4);
    expect(stepPotMonth(5, 1)).toBe(8);
    expect(stepPotMonth(8, 1)).toBe(8);
    expect(stepPotMonth(8, -1)).toBe(5);
    expect(stepPotMonth(1, -1)).toBe(0);
    expect(stepPotMonth(0, -1)).toBe(0);
    expect(potMonthAt(today, 3)).toBe('2027-01');
    expect(potMonthAt(today, 0)).toBeNull();
  });
});
