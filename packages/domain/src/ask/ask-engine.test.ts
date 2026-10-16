import { describe, expect, it } from 'vitest';

import {
  cycleFutureYou,
  dailyNumber,
  type DailyNumber,
  type DailyNumberInput,
} from '../plan/daily-number';
import { whatIfDaily } from '../plan/plan-river';
import { answerAsk, type AskContext } from './ask-engine';
import { readIntent } from './ask-intent';
import { allowanceDayOf, freeAsksLeft } from './ask-quota';

/** The designed Friday 9 October: 351k line, 49k safe, 353k tomorrow, 22 days to payday. */
const day: DailyNumber = {
  startFree: 8_085_000,
  line: 351_000,
  spent: 302_000,
  free: 7_783_000,
  safe: 49_000,
  tomorrow: 353_000,
  replan: false,
  overspent: false,
};

const ctx: AskContext = {
  today: '2026-10-09',
  day,
  daysLeft: 22,
  payday: '2026-10-31',
  futureYou: 2_000_000,
  share: 1,
  pots: [{ name: 'Tết & lì xì', goal: 3_000_000, saved: 1_200_000, monthly: 450_000 }],
};

describe('readIntent', () => {
  it('reads amounts, weekends, saving and pots in English and Vietnamese', () => {
    expect(readIntent('Can I afford 2tr on Saturday?')).toEqual({
      kind: 'afford',
      amount: 2_000_000,
    });
    expect(readIntent('mua giày 1tr5 được không')).toEqual({ kind: 'afford', amount: 1_500_000 });
    expect(readIntent('How much for the weekend?')).toEqual({ kind: 'weekend' });
    expect(readIntent('cuối tuần tiêu bao nhiêu')).toEqual({ kind: 'weekend' });
    expect(readIntent('What if I save 1tr more?')).toEqual({ kind: 'saveMore', amount: 1_000_000 });
    expect(readIntent('When is the Tết pot full?', ['Tết & lì xì', 'Tết'])).toEqual({
      kind: 'potFull',
      pot: 'Tết',
    });
    expect(readIntent('hello')).toEqual({ kind: 'unknown' });
  });
});

describe('answerAsk', () => {
  it('says a spend inside today’s safe money leaves tomorrow alone', () => {
    const a = answerAsk({ kind: 'afford', amount: 40_000 }, ctx);
    expect(a).toMatchObject({ kind: 'fitsToday', bars: { before: 353_000, after: 353_000 } });
  });

  it('spreads a bigger spend over the days left', () => {
    const a = answerAsk({ kind: 'afford', amount: 500_000 }, ctx);
    // (7.783.000 − 500.000) ÷ 22 = 331.045 → 331.000
    expect(a).toMatchObject({ kind: 'fits', bars: { before: 353_000, after: 331_000 } });
  });

  it('calls it tight below 60% of the line and offers money back from the pots', () => {
    const a = answerAsk({ kind: 'afford', amount: 4_000_000 }, ctx);
    // (7.783.000 − 4.000.000) ÷ 22 = 171.954 → 171.000; with 1.000.000 back: 217.000
    expect(a).toMatchObject({
      kind: 'tight',
      bars: { after: 171_000 },
      fromPots: { take: 1_000_000, withPots: 217_000 },
    });
  });

  it('says not this month when the spend is more than all the free money', () => {
    const a = answerAsk({ kind: 'afford', amount: 9_000_000 }, ctx);
    expect(a).toMatchObject({ kind: 'notThisMonth', payday: '2026-10-31', bars: { after: 0 } });
  });

  it('finds the coming Saturday and Sunday', () => {
    const a = answerAsk({ kind: 'weekend' }, ctx);
    expect(a).toEqual({
      kind: 'weekend',
      days: [
        { day: '2026-10-10', amount: 353_000 },
        { day: '2026-10-11', amount: 353_000 },
      ],
      total: 706_000,
    });
  });

  it('prices saving more as money a day', () => {
    const a = answerAsk({ kind: 'saveMore', amount: 500_000 }, ctx);
    expect(a).toMatchObject({ kind: 'saveMore', perDay: 22_000, bars: { after: 331_000 } });
  });

  it('takes only the joined share of the cycle out of free money when saving more', () => {
    // Joined halfway through the cycle: 500.000 more to Future you costs the half still to come.
    // (7.783.000 − 250.000) ÷ 22 = 342.409 → 342.000, so 11.000 a day.
    const a = answerAsk({ kind: 'saveMore', amount: 500_000 }, { ...ctx, share: 0.5 });
    expect(a).toMatchObject({ kind: 'saveMore', perDay: 11_000, bars: { after: 342_000 } });
  });

  it('agrees with the what-if slider, which runs the daily number engine', () => {
    const input: DailyNumberInput = {
      plan: { income: 20_000_000, bills: 5_000_000, futureYou: 2_000_000, occasions: 0, topUps: 0 },
      spentBefore: 0,
      today: [],
      notDaily: new Set(),
      daysLeft: 9,
      share: 0.5,
    };
    const now = dailyNumber(input);
    const slider = whatIfDaily(input, 2_500_000);
    const asked = answerAsk(
      { kind: 'saveMore', amount: 500_000 },
      { ...ctx, day: now, daysLeft: 9, share: 0.5 },
    );
    expect(asked).toMatchObject({ kind: 'saveMore', bars: { after: slider } });
  });

  it('changes nothing this cycle when the joined cycle starts Future you at payday', () => {
    const input: DailyNumberInput = {
      plan: { income: 20_000_000, bills: 5_000_000, futureYou: 2_000_000, occasions: 0, topUps: 0 },
      spentBefore: 0,
      today: [],
      notDaily: new Set(),
      daysLeft: 9,
      beforeJoining: 4_000_000,
      futureYouSkipped: true,
    };
    const now = dailyNumber(input);
    const asked = answerAsk(
      { kind: 'saveMore', amount: 500_000 },
      {
        ...ctx,
        day: now,
        daysLeft: 9,
        futureYou: 2_000_000,
        futureYouThisCycle: cycleFutureYou(input),
      },
    );
    // The slider agrees: Future you is not taken from this cycle, whatever its monthly amount.
    expect(whatIfDaily(input, 2_500_000)).toBe(now.tomorrow);
    expect(asked).toMatchObject({
      kind: 'saveMore',
      futureYou: 0,
      perDay: 0,
      bars: { before: now.tomorrow, after: now.tomorrow },
    });
  });

  it('works out when a pot fills', () => {
    const a = answerAsk({ kind: 'potFull', pot: 'tết' }, ctx);
    // 1.800.000 left at 450.000 a month: 4 months → February
    expect(a).toMatchObject({ kind: 'potFull', fullIn: '2027-02', full: false });
    expect(answerAsk({ kind: 'potFull' }, { ...ctx, pots: [] })).toEqual({ kind: 'noPots' });
    expect(answerAsk({ kind: 'potFull', pot: 'Laptop' }, ctx)).toEqual({
      kind: 'noSuchPot',
      name: 'Laptop',
    });
  });
});

describe('freeAsksLeft', () => {
  it('counts today’s questions only, ten a day', () => {
    expect(freeAsksLeft([], '2026-10-09')).toBe(10);
    expect(freeAsksLeft(['2026-10-09', '2026-10-09', '2026-10-08'], '2026-10-09')).toBe(8);
    expect(freeAsksLeft(Array<string>(12).fill('2026-10-09'), '2026-10-09')).toBe(0);
    expect(freeAsksLeft(Array<string>(10).fill('2026-10-09'), '2026-10-10')).toBe(10);
  });

  it('starts again at local midnight, not at the money day’s 04:00', () => {
    expect(allowanceDayOf(new Date(2026, 9, 9, 23, 59))).toBe('2026-10-09');
    expect(allowanceDayOf(new Date(2026, 9, 10, 0, 0))).toBe('2026-10-10');
    expect(allowanceDayOf(new Date(2026, 9, 10, 3, 0))).toBe('2026-10-10');
  });
});
