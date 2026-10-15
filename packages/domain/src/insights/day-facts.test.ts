import { describe, expect, it } from 'vitest';

import {
  billFacts,
  nextDueDate,
  paydayFacts,
  todayFacts,
  waitingFacts,
  workFacts,
} from './day-facts';
import { day, input, spend, TODAY } from './insight-fixture';

describe('todayFacts', () => {
  it('tells an over day with what is over and tomorrow’s line', () => {
    const [fact] = todayFacts(
      input({ day: day({ spent: 400_000, safe: -49_000, tomorrow: 349_000 }) }),
    );
    expect(fact).toMatchObject({
      kind: 'todayOver',
      tone: 'watch',
      slots: { over: { type: 'money', value: 49_000 }, tomorrow: { value: 349_000 } },
    });
  });

  it('tells an under day with what is still safe', () => {
    const [fact] = todayFacts(input({ day: day({ spent: 100_000, safe: 251_000 }) }));
    expect(fact).toMatchObject({
      kind: 'todayUnder',
      tone: 'good',
      slots: { safe: { value: 251_000 } },
    });
  });

  it('tells a day with nothing spent, but not one with no line to spend', () => {
    expect(todayFacts(input())[0]?.kind).toBe('noSpendYet');
    expect(todayFacts(input({ day: day({ line: 0, safe: 0 }) }))).toEqual([]);
  });
});

describe('waitingFacts', () => {
  it('counts what the close will walk through, earlier waiting days included', () => {
    const [fact] = waitingFacts(
      input({
        spends: [
          spend('2026-10-07', 'Grab', 40_000, 'transport', 'caught'),
          spend(TODAY, 'Highlands', 59_000, 'drinks', 'pending'),
          spend(TODAY, 'Phở Hòa', 45_000, 'food', 'kept'),
          spend(TODAY, 'Rent', 3_500_000, 'home', 'caught'),
        ],
      }),
    );
    // Rent waits too, but does not count toward the day.
    expect(fact).toMatchObject({
      kind: 'waitingTonight',
      slots: { count: { value: 3 }, amount: { value: 99_000 } },
    });
  });

  it('says nothing when nothing waits', () => {
    expect(waitingFacts(input({ spends: [spend(TODAY, 'Phở Hòa', 45_000)] }))).toEqual([]);
  });
});

describe('paydayFacts', () => {
  const cycle = (daysLeft: number) => ({ start: '2026-09-30', payday: '2026-10-31', daysLeft });

  it('tells payday within three days, never on or after it', () => {
    expect(paydayFacts(input({ cycle: cycle(3) }))[0]?.slots).toEqual({
      days: { type: 'count', value: 3 },
      payday: { type: 'date', value: '2026-10-31' },
    });
    expect(paydayFacts(input({ cycle: cycle(4) }))).toEqual([]);
    expect(paydayFacts(input({ cycle: cycle(0) }))).toEqual([]);
  });
});

describe('nextDueDate', () => {
  it('clamps to short months and rolls into next month and next year', () => {
    expect(nextDueDate({ dueDay: 31 }, '2026-02-10')).toBe('2026-02-28');
    expect(nextDueDate({ dueDay: 5 }, '2026-10-09')).toBe('2026-11-05');
    expect(nextDueDate({ dueDay: 5 }, '2026-12-09')).toBe('2027-01-05');
    expect(nextDueDate({ dueDay: 9 }, '2026-10-09')).toBe('2026-10-09');
  });
});

describe('billFacts', () => {
  const bill = (id: string, dueDay: number, paid = false) => ({
    id,
    name: id,
    amount: 500_000,
    dueDay,
    paid,
  });

  it('tells unpaid bills due within three days, nearest first and most salient', () => {
    const facts = billFacts(
      input({
        bills: [bill('phone', 12), bill('net', 9), bill('rent', 10, true), bill('gym', 20)],
      }),
    );
    expect(facts.map((f) => f.key)).toEqual(['billDue:net:2026-10-09', 'billDue:phone:2026-10-12']);
    expect(facts[0]?.salience).toBeGreaterThan(facts[1]?.salience ?? 1);
  });
});

describe('workFacts', () => {
  it('totals this cycle’s work spends still to claim back', () => {
    const facts = workFacts(
      input({
        spends: [
          spend('2026-10-02', 'Taxi', 120_000, 'transport', 'kept', { forWork: true }),
          spend('2026-10-05', 'Lunch', 200_000, 'food', 'caught', { forWork: true }),
          spend('2026-10-06', 'Lunch', 90_000, 'food', 'skipped', { forWork: true }),
          spend('2026-09-20', 'Hotel', 900_000, 'travel', 'kept', { forWork: true }),
        ],
      }),
    );
    expect(facts[0]?.slots).toEqual({
      count: { type: 'count', value: 2 },
      amount: { type: 'money', value: 320_000 },
    });
  });
});
