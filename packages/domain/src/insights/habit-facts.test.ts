import { describe, expect, it } from 'vitest';

import { addDays, weekdayMondayFirst } from '../time/local-date';
import {
  lateNightFacts,
  likelySubscriptionFacts,
  recordDayFacts,
  weekendHeavyFacts,
} from './habit-facts';
import { input, spend, TODAY } from './insight-fixture';

/** One spend a day over the four weeks before Fri 9 Oct: `weekend` on Sat and Sun. */
function month(weekend: number, weekday: number, from = '2026-09-11') {
  const spends = [];
  for (let d = from; d < TODAY; d = addDays(d, 1)) {
    const amount = weekdayMondayFirst(d) >= 5 ? weekend : weekday;
    spends.push(spend(d, 'Phở Hòa', amount));
  }
  return spends;
}

describe('weekendHeavyFacts', () => {
  it('tells weekend days spending well over weekdays, from Friday', () => {
    const facts = weekendHeavyFacts(input({ spends: month(400_000, 100_000) }));
    expect(facts[0]).toMatchObject({
      kind: 'weekendHeavy',
      slots: { weekend: { value: 400_000 }, weekday: { value: 100_000 } },
    });
  });

  it('stays quiet midweek, on an even month, and without four weeks of log', () => {
    expect(
      weekendHeavyFacts(input({ today: '2026-10-07', spends: month(400_000, 100_000) })),
    ).toEqual([]);
    expect(weekendHeavyFacts(input({ spends: month(120_000, 100_000) }))).toEqual([]);
    expect(weekendHeavyFacts(input({ spends: month(400_000, 100_000, '2026-09-20') }))).toEqual([]);
  });
});

describe('recordDayFacts', () => {
  const history = [
    spend('2026-09-01', 'Lotte', 300_000, 'groceries'),
    spend('2026-09-20', 'Uniqlo', 600_000, 'shopping'),
  ];

  it('tells today as the biggest day in the log', () => {
    const facts = recordDayFacts(
      input({
        spends: [
          ...history,
          spend(TODAY, 'Uniqlo', 500_000),
          spend(TODAY, 'Gift', 300_000, 'gifts'),
        ],
      }),
    );
    expect(facts[0]).toMatchObject({
      kind: 'recordDay',
      tone: 'watch',
      slots: { amount: { value: 800_000 }, days: { value: 38 } },
    });
    expect(facts[0]?.about).toEqual(['food', 'gifts']);
  });

  it('stays quiet when an earlier day was bigger, below twice the line, or with a short log', () => {
    expect(recordDayFacts(input({ spends: [...history, spend(TODAY, 'Lotte', 600_000)] }))).toEqual(
      [],
    );
    expect(
      recordDayFacts(
        input({ spends: [spend('2026-09-01', 'Kiosk', 10_000), spend(TODAY, 'Lotte', 500_000)] }),
      ),
    ).toEqual([]);
    expect(
      recordDayFacts(
        input({ spends: [spend('2026-09-20', 'Kiosk', 10_000), spend(TODAY, 'Lotte', 900_000)] }),
      ),
    ).toEqual([]);
  });
});

describe('likelySubscriptionFacts', () => {
  const netflix = (days: string[], amounts = [260_000, 260_000, 260_000]) =>
    days.map((d, i) => spend(d, 'Netflix', amounts[i] ?? 0, 'fun'));

  it('tells three charges a month apart at about the same amount, just after the latest', () => {
    const facts = likelySubscriptionFacts(
      input({
        spends: netflix(['2026-08-05', '2026-09-05', '2026-10-05'], [250_000, 260_000, 260_000]),
      }),
    );
    expect(facts[0]).toMatchObject({
      kind: 'likelySubscription',
      key: 'likelySubscription:netflix',
      slots: { merchant: { value: 'Netflix' }, amount: { value: 260_000 }, months: { value: 3 } },
    });
  });

  it('is no subscription when it is a bill, irregular, uneven, stale or only twice', () => {
    const regular = ['2026-08-05', '2026-09-05', '2026-10-05'];
    const bill = { id: 'n', name: 'netflix ', amount: 260_000, dueDay: 5, paid: true };
    expect(likelySubscriptionFacts(input({ spends: netflix(regular), bills: [bill] }))).toEqual([]);
    const irregular = netflix(['2026-08-05', '2026-09-20', '2026-10-05']);
    expect(likelySubscriptionFacts(input({ spends: irregular }))).toEqual([]);
    const uneven = netflix(regular, [180_000, 260_000, 260_000]);
    expect(likelySubscriptionFacts(input({ spends: uneven }))).toEqual([]);
    const stale = netflix(['2026-07-30', '2026-08-30', '2026-09-30']);
    expect(likelySubscriptionFacts(input({ spends: stale }))).toEqual([]);
    expect(likelySubscriptionFacts(input({ spends: netflix(regular.slice(1)) }))).toEqual([]);
  });
});

describe('lateNightFacts', () => {
  const at = (hour: number, source: 'applePay' | 'manual') =>
    spend('2026-10-08', 'Shopee', 320_000, 'shopping', 'kept', { hour, source });

  it('tells a payment made late at night, from a source that records the time', () => {
    const facts = lateNightFacts(input({ spends: [at(1.5, 'applePay'), at(23.2, 'applePay')] }));
    expect(facts).toHaveLength(1);
    expect(facts[0]).toMatchObject({
      kind: 'lateNight',
      slots: { merchant: { value: 'Shopee' }, amount: { value: 320_000 } },
    });
  });

  it('ignores daytime payments and times typed in by hand', () => {
    expect(lateNightFacts(input({ spends: [at(14, 'applePay')] }))).toEqual([]);
    expect(lateNightFacts(input({ spends: [at(23.5, 'manual')] }))).toEqual([]);
  });
});
