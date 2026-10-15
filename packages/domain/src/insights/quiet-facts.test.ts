import { describe, expect, it } from 'vitest';

import { input, spend, TODAY } from './insight-fixture';
import { collectFacts } from './moment';
import { backUnderFacts, logGapFacts, noSpendFacts } from './quiet-facts';

const LINE = 351_000;
const closedDay = (d: string, spent: number) => ({ day: d, spent, line: LINE });

describe('noSpendFacts', () => {
  it('tells one closed day that cost nothing', () => {
    const facts = noSpendFacts(input({ closed: [closedDay('2026-10-08', 0)] }));
    expect(facts).toHaveLength(1);
    expect(facts[0]).toMatchObject({
      kind: 'noSpendDay',
      tone: 'good',
      slots: { kept: { value: LINE } },
    });
  });

  it('tells two or more in a row as a streak, back from today once it is closed', () => {
    const facts = noSpendFacts(
      input({
        closed: [closedDay('2026-10-06', 50_000), closedDay('2026-10-07', 0)].concat([
          closedDay('2026-10-08', 0),
          closedDay(TODAY, 0),
        ]),
      }),
    );
    expect(facts[0]).toMatchObject({
      kind: 'noSpendStreak',
      key: `noSpendStreak:${TODAY}:3`,
      slots: { days: { value: 3 }, kept: { value: LINE * 3 } },
    });
  });

  it('is no no-spend day when anything was logged, counted or not, or when unclosed', () => {
    const logged = input({
      closed: [closedDay('2026-10-08', 0)],
      spends: [spend('2026-10-08', 'Rent', 5_000_000, 'home')],
    });
    expect(noSpendFacts(logged)).toEqual([]);
    expect(noSpendFacts(input({ closed: [closedDay('2026-10-07', 0)] }))).toEqual([]);
    expect(noSpendFacts(input())).toEqual([]);
  });
});

describe('backUnderFacts', () => {
  it('cheers a day back under right after one over', () => {
    const facts = backUnderFacts(
      input({ closed: [closedDay('2026-10-07', 420_000), closedDay('2026-10-08', 300_000)] }),
    );
    expect(facts[0]).toMatchObject({
      kind: 'backUnder',
      key: 'backUnder:2026-10-08',
      slots: { spare: { value: 51_000 } },
    });
  });

  it('stays quiet after a day under, or when the last day went over', () => {
    const under = [closedDay('2026-10-07', 300_000), closedDay('2026-10-08', 300_000)];
    expect(backUnderFacts(input({ closed: under }))).toEqual([]);
    const over = [closedDay('2026-10-07', 420_000), closedDay('2026-10-08', 420_000)];
    expect(backUnderFacts(input({ closed: over }))).toEqual([]);
  });
});

describe('logGapFacts', () => {
  it('asks after two days with nothing logged and nothing yet today', () => {
    const facts = logGapFacts(input({ spends: [spend('2026-10-06', 'Phở Hòa', 45_000)] }));
    expect(facts[0]).toMatchObject({
      kind: 'logGap',
      tone: 'neutral',
      slots: { days: { value: 2 }, since: { value: '2026-10-06' } },
    });
  });

  it('stays quiet after a shorter gap, and with nothing ever logged', () => {
    expect(logGapFacts(input({ spends: [spend('2026-10-07', 'Phở Hòa', 45_000)] }))).toEqual([]);
    expect(logGapFacts(input())).toEqual([]);
  });

  it('keeps praise read from spending quiet while the log is quiet', () => {
    const facts = collectFacts(
      input({
        spends: [spend('2026-10-05', 'Phở Hòa', 45_000)],
        closed: ['2026-10-06', '2026-10-07', '2026-10-08'].map((d) => closedDay(d, 0)),
      }),
    );
    const kinds = facts.map((f) => f.kind);
    expect(kinds).toContain('logGap');
    expect(kinds).toContain('closeStreak');
    for (const praise of ['noSpendStreak', 'underStreak', 'noSpendYet', 'weekSpare'] as const) {
      expect(kinds).not.toContain(praise);
    }
  });
});
