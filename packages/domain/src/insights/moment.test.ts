import { describe, expect, it } from 'vitest';

import type { Fact } from './fact';
import { day, input, spend, TODAY } from './insight-fixture';
import { collectFacts, pickFact, remember, type SaidFact } from './moment';

const fact = (overrides: Partial<Fact> & Pick<Fact, 'kind' | 'key'>): Fact =>
  ({
    tone: 'neutral',
    salience: 0.5,
    repeatAfterDays: 3,
    slots: {},
    ...overrides,
  }) as Fact;

const merchantFact = (merchant: string, salience: number): Fact =>
  fact({
    kind: 'repeatMerchant',
    key: `repeatMerchant:${merchant}`,
    salience,
    slots: {
      merchant: { type: 'merchant', value: merchant },
      visits: { type: 'count', value: 3 },
      amount: { type: 'money', value: 1 },
    },
  });

const base = { today: TODAY, memory: [] as SaidFact[], underToday: false };

describe('pickFact', () => {
  it('picks the most salient fact the moment allows', () => {
    const facts = [
      fact({ kind: 'waitingTonight', key: 'w', salience: 0.9 }),
      fact({ kind: 'closeStreak', key: 'c', salience: 0.4 }),
      fact({ kind: 'paydaySoon', key: 'p', salience: 0.5 }),
    ];
    expect(pickFact({ ...base, moment: 'today', facts })?.key).toBe('p');
    expect(pickFact({ ...base, moment: 'reminder', facts })?.key).toBe('w');
  });

  it('breaks ties by key, so the choice is stable', () => {
    const facts = [fact({ kind: 'paydaySoon', key: 'b' }), fact({ kind: 'closeStreak', key: 'a' })];
    expect(pickFact({ ...base, moment: 'today', facts })?.key).toBe('a');
  });

  it('does not repeat a fact inside its window', () => {
    const facts = [fact({ kind: 'paydaySoon', key: 'p' })];
    const memory: SaidFact[] = [{ key: 'p', tone: 'good', on: '2026-10-08', until: '2026-10-10' }];
    expect(pickFact({ ...base, moment: 'today', facts, memory })).toBeNull();
    const expired: SaidFact[] = [{ key: 'p', tone: 'good', on: '2026-10-05', until: TODAY }];
    expect(pickFact({ ...base, moment: 'today', facts, memory: expired })?.key).toBe('p');
  });

  it('keeps watch facts off a day under its line and to one a day', () => {
    const facts = [
      fact({ kind: 'todayOver', key: 'over', tone: 'watch', salience: 0.8 }),
      fact({ kind: 'closeStreak', key: 'streak', tone: 'good', salience: 0.4 }),
    ];
    expect(pickFact({ ...base, moment: 'today', facts })?.key).toBe('over');
    expect(pickFact({ ...base, moment: 'today', facts, underToday: true })?.key).toBe('streak');
    const memory: SaidFact[] = [{ key: 'pace', tone: 'watch', on: TODAY, until: '2026-10-16' }];
    expect(pickFact({ ...base, moment: 'today', facts, memory })?.key).toBe('streak');
  });

  it('after a capture, talks only about the place just caught', () => {
    const facts = [merchantFact('Grab', 0.7), merchantFact('Highlands', 0.5)];
    const picked = pickFact({ ...base, moment: 'capture', facts, focusMerchant: ' highlands' });
    expect(picked?.key).toBe('repeatMerchant:Highlands');
  });
});

describe('remember', () => {
  it('records the fact until its window ends and drops expired entries', () => {
    const memory: SaidFact[] = [
      { key: 'old', tone: 'good', on: '2026-09-01', until: '2026-09-04' },
      { key: 'today', tone: 'watch', on: TODAY, until: TODAY },
      { key: 'live', tone: 'good', on: '2026-10-08', until: '2026-10-11' },
    ];
    const next = remember(
      memory,
      fact({ kind: 'paydaySoon', key: 'p', repeatAfterDays: 4 }),
      TODAY,
    );
    expect(next.map((m) => m.key)).toEqual(['today', 'live', 'p']);
    expect(next.at(-1)).toEqual({ key: 'p', tone: 'neutral', on: TODAY, until: '2026-10-13' });
  });

  it('keeps no more than two hundred entries', () => {
    let memory: SaidFact[] = [];
    for (let i = 0; i < 250; i += 1) {
      memory = remember(
        memory,
        fact({ kind: 'paydaySoon', key: `k${String(i)}`, repeatAfterDays: 30 }),
        TODAY,
      );
    }
    expect(memory).toHaveLength(200);
    expect(memory[0]?.key).toBe('k50');
  });
});

describe('collectFacts', () => {
  it('finds the design day’s facts, and the bubble picks one', () => {
    const facts = collectFacts(
      input({
        day: day({ spent: 104_000, safe: 247_000 }),
        cycle: { start: '2026-09-30', payday: '2026-10-11', daysLeft: 2 },
        spends: [
          spend('2026-10-05', 'Highlands', 59_000, 'drinks'),
          spend('2026-10-07', 'Highlands', 59_000, 'drinks'),
          spend(TODAY, 'Highlands', 59_000, 'drinks', 'caught'),
          spend(TODAY, 'Phở Hòa', 45_000),
        ],
        closed: [
          { day: '2026-10-07', spent: 300_000, line: 351_000 },
          { day: '2026-10-08', spent: 300_000, line: 351_000 },
        ],
      }),
    );
    expect(new Set(facts.map((f) => f.kind))).toEqual(
      new Set([
        'todayUnder',
        'waitingTonight',
        'paydaySoon',
        'repeatMerchant',
        'firstTimeMerchant',
        'underStreak',
        'weekSpare',
      ]),
    );
    const picked = pickFact({ ...base, moment: 'today', facts, underToday: true });
    expect(picked?.kind).toBe('repeatMerchant');
  });
});
