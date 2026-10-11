import { describe, expect, it } from '@jest/globals';

import { payCycleOn, type PotRow } from '@6pm/domain';

import type { MoneySnapshot } from '../../data/money-store';
import { askContextOf } from './ask-context';

const today = '2026-10-09';
const at = '2026-10-01T00:00:00.000Z';

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
  cycle: payCycleOn(today, { kind: 'sameDay', day: 31 }),
  categories: [],
  cycleSpends: [],
  bills: [],
  pots: [
    pot({ id: 'Japan', kind: 'goal', goal: 6_000_000, share: 0.6, neededBy: '2027-03' }),
    pot({ id: 'Tết', kind: 'occasion', goal: 3_000_000, neededBy: '2027-02' }),
    pot({ id: 'Paused', kind: 'occasion', goal: 1_000_000, neededBy: '2027-02', paused: true }),
  ],
  potSaved: { Japan: 3_600_000, Tết: 1_200_000 },
  topUpsThisCycle: 0,
  setAsideThisCycle: { Tết: 450_000 },
  closedDays: [],
};

describe('askContextOf', () => {
  it('reads today, payday, Future you and each pot with its monthly pace from the store', () => {
    const ctx = askContextOf(snap);
    expect(ctx).toMatchObject({
      today,
      daysLeft: 22,
      payday: '2026-10-31',
      futureYou: 2_000_000,
    });
    expect(ctx?.pots).toEqual([
      { name: 'Japan', goal: 6_000_000, saved: 3_600_000, monthly: 1_200_000 },
      { name: 'Tết', goal: 3_000_000, saved: 1_200_000, monthly: 450_000 },
      { name: 'Paused', goal: 1_000_000, saved: 0, monthly: 0 },
    ]);
  });

  it('has nothing to work from before the month is set up', () => {
    expect(askContextOf({ ...snap, plan: null })).toBeNull();
  });
});
