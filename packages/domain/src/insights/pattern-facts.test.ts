import { describe, expect, it } from 'vitest';

import { input, spend, TODAY, day } from './insight-fixture';
import {
  biggestSpendFacts,
  categoryPaceFacts,
  firstTimeFacts,
  repeatMerchantFacts,
} from './pattern-facts';

describe('categoryPaceFacts', () => {
  // Nine days into the cycle (30 Sep → 9 Oct) against 31 Aug → 9 Sep.
  const spends = [
    spend('2026-09-02', 'Highlands', 150_000, 'drinks'),
    spend('2026-10-03', 'Highlands', 160_000, 'drinks'),
    spend('2026-10-06', 'Highlands', 160_000, 'drinks'),
    spend('2026-09-03', 'Grab', 300_000, 'transport'),
    spend('2026-10-04', 'Grab', 100_000, 'transport'),
    spend('2026-09-04', 'Phở Hòa', 200_000, 'food'),
    spend('2026-10-05', 'Phở Hòa', 210_000, 'food'),
    // After the same nine days of last cycle: not compared.
    spend('2026-09-20', 'Highlands', 900_000, 'drinks'),
  ];

  it('tells categories well ahead (watch) or behind (good), biggest change first', () => {
    const facts = categoryPaceFacts(input({ spends }));
    expect(facts.map((f) => [f.key, f.tone])).toEqual([
      ['categoryPace:transport:muchLess', 'good'],
      ['categoryPace:drinks:muchMore', 'watch'],
    ]);
    expect(facts[1]?.slots).toMatchObject({
      now: { value: 320_000 },
      before: { value: 150_000 },
    });
  });

  it('stays quiet early in the cycle and without a cycle before', () => {
    expect(categoryPaceFacts(input({ spends, today: '2026-10-01' }))).toEqual([]);
    expect(categoryPaceFacts(input({ spends, previousCycleStart: null }))).toEqual([]);
  });

  it('ignores small amounts and categories with nothing to compare against', () => {
    const small = [
      spend('2026-09-02', 'Kiosk', 20_000, 'snacks'),
      spend('2026-10-03', 'Kiosk', 60_000, 'snacks'),
      spend('2026-10-03', 'Gym', 500_000, 'sport'),
    ];
    expect(categoryPaceFacts(input({ spends: small }))).toEqual([]);
  });
});

describe('repeatMerchantFacts', () => {
  it('tells a place visited three times or more since Monday, whatever its case', () => {
    const facts = repeatMerchantFacts(
      input({
        spends: [
          spend('2026-10-04', 'Highlands', 59_000, 'drinks'), // last week
          spend('2026-10-05', 'Highlands', 59_000, 'drinks'),
          spend('2026-10-07', 'highlands ', 65_000, 'drinks'),
          spend(TODAY, 'HIGHLANDS', 59_000, 'drinks', 'caught'),
          spend(TODAY, 'Highlands', 59_000, 'drinks', 'skipped'),
          spend(TODAY, 'Phở Hòa', 45_000),
        ],
      }),
    );
    expect(facts).toHaveLength(1);
    expect(facts[0]).toMatchObject({
      key: 'repeatMerchant:highlands:3',
      slots: { merchant: { value: 'Highlands' }, visits: { value: 3 }, amount: { value: 183_000 } },
    });
  });
});

describe('firstTimeFacts', () => {
  it('tells today’s new places only', () => {
    const facts = firstTimeFacts(
      input({
        spends: [
          spend('2026-10-02', 'Phở Hòa', 45_000),
          spend(TODAY, 'phở hòa', 45_000),
          spend(TODAY, 'Katinat', 55_000, 'drinks'),
        ],
      }),
    );
    expect(facts.map((f) => f.key)).toEqual(['firstTimeMerchant:katinat']);
  });

  it('stays quiet with nothing earlier to compare against', () => {
    expect(firstTimeFacts(input({ spends: [spend(TODAY, 'Katinat', 55_000)] }))).toEqual([]);
  });
});

describe('biggestSpendFacts', () => {
  it('tells the week’s biggest spend when it is at least twice the line', () => {
    const facts = biggestSpendFacts(
      input({
        spends: [
          spend('2026-10-06', 'Uniqlo', 800_000, 'shopping'),
          spend('2026-10-07', 'Lotte', 702_000, 'groceries'),
          spend('2026-10-02', 'Last week', 2_000_000, 'shopping'),
        ],
      }),
    );
    expect(facts[0]?.slots).toMatchObject({
      merchant: { value: 'Uniqlo' },
      amount: { value: 800_000 },
    });
  });

  it('says nothing when no spend stands out', () => {
    expect(
      biggestSpendFacts(
        input({ day: day({ line: 500_000 }), spends: [spend(TODAY, 'Lotte', 900_000)] }),
      ),
    ).toEqual([]);
  });
});
