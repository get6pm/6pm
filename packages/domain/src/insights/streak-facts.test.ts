import { describe, expect, it } from 'vitest';

import { addDays } from '../time/local-date';
import { input, spend, TODAY } from './insight-fixture';
import { closeStreakFacts, potFacts, underStreakFacts, weekFacts } from './streak-facts';

const line = 351_000;
/** `n` closed days ending on `last`, each spending `spent`. */
const run = (last: string, n: number, spent = 300_000) =>
  Array.from({ length: n }, (_, i) => ({ day: addDays(last, -i), spent, line }));

describe('closeStreakFacts', () => {
  it('counts closed days back from yesterday while today is open', () => {
    const [fact] = closeStreakFacts(input({ closed: run('2026-10-08', 4) }));
    expect(fact).toMatchObject({ key: 'closeStreak:4', slots: { days: { value: 4 } } });
  });

  it('counts today once it is closed, and stops at a day never closed', () => {
    const closed = [...run(TODAY, 3), ...run('2026-10-05', 5)];
    expect(closeStreakFacts(input({ closed }))[0]?.key).toBe('closeStreak:3');
  });

  it('needs three days, and makes a milestone worth more', () => {
    expect(closeStreakFacts(input({ closed: run('2026-10-08', 2) }))).toEqual([]);
    const six = closeStreakFacts(input({ closed: run('2026-10-08', 6) }))[0]?.salience ?? 0;
    const seven = closeStreakFacts(input({ closed: run('2026-10-08', 7) }))[0]?.salience ?? 0;
    expect(seven).toBeGreaterThan(six);
  });
});

describe('underStreakFacts', () => {
  it('counts closed days at or under their line, stopping at one over', () => {
    const closed = [
      ...run('2026-10-08', 2),
      { day: '2026-10-06', spent: 400_000, line },
      ...run('2026-10-05', 3),
    ];
    expect(underStreakFacts(input({ closed }))[0]?.key).toBe('underStreak:2');
    expect(underStreakFacts(input({ closed: run('2026-10-08', 1) }))).toEqual([]);
  });
});

describe('weekFacts', () => {
  it('tells the closed days’ money left over this week', () => {
    const closed = run('2026-10-08', 3, 251_000);
    const [fact] = weekFacts(input({ closed }));
    expect(fact).toMatchObject({
      kind: 'weekSpare',
      slots: { days: { value: 3 }, spare: { value: 300_000 } },
    });
  });

  it('tells a week that ran over as a gentle watch, ignoring last week', () => {
    const closed = [
      { day: '2026-10-04', spent: 0, line },
      { day: '2026-10-05', spent: 500_000, line },
    ];
    const [fact] = weekFacts(input({ closed, spends: [spend('2026-10-05', 'Lotte', 500_000)] }));
    expect(fact).toMatchObject({
      kind: 'weekOver',
      tone: 'watch',
      slots: { over: { value: 149_000 } },
    });
  });

  it('says nothing before a day of the week is closed', () => {
    expect(weekFacts(input())).toEqual([]);
  });
});

describe('potFacts', () => {
  const pot = (id: string, goal: number, saved: number) => ({ id, name: id, goal, saved });

  it('tells the highest milestone passed, and a full pot', () => {
    const facts = potFacts(
      input({
        pots: [
          pot('trip', 4_000_000, 2_100_000),
          pot('tet', 2_000_000, 2_000_000),
          pot('new', 1_000_000, 100_000),
        ],
      }),
    );
    expect(facts.map((f) => f.key)).toEqual([
      'potMilestone:trip:4000000:50',
      'potFull:tet:2000000',
    ]);
  });

  it('keys a milestone by goal, so a raised goal can be told again', () => {
    const [a] = potFacts(input({ pots: [pot('trip', 4_000_000, 3_000_000)] }));
    const [b] = potFacts(input({ pots: [pot('trip', 6_000_000, 4_500_000)] }));
    expect(a?.key).not.toBe(b?.key);
  });
});
