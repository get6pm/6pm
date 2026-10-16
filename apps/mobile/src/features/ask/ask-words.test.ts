import { describe, expect, it } from '@jest/globals';

import {
  answerAsk,
  moneyFormat,
  vndLocale,
  type AskContext,
  type AskIntent,
  type DailyNumber,
} from '@6pm/domain';
import { t, type Language } from '@6pm/i18n';

import { describeAnswer, type AskWordsEnv } from './ask-words';

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
  pots: [{ name: 'Tết', goal: 3_000_000, saved: 1_200_000, monthly: 450_000 }],
};

const names: Record<Language, { weekday: Record<string, string>; month: string; payday: string }> =
  {
    en: {
      weekday: { '2026-10-10': 'Saturday', '2026-10-11': 'Sunday' },
      month: 'February 2027',
      payday: '31 October',
    },
    vi: {
      weekday: { '2026-10-10': 'Thứ Bảy', '2026-10-11': 'Chủ Nhật' },
      month: 'tháng 2 năm 2027',
      payday: '31 tháng 10',
    },
  };

const envFor = (language: Language): AskWordsEnv => ({
  t: (key, ...params) => t(language, key, ...params),
  language,
  money: moneyFormat(vndLocale(language)),
  monthLong: () => names[language].month,
  dayLongMonth: () => names[language].payday,
  weekday: (d) => names[language].weekday[d] ?? d,
});

const words = (
  intent: AskIntent,
  language: Language = 'en',
  from: AskContext = ctx,
  offline = false,
) => describeAnswer(answerAsk(intent, from), from, { offline }, envFor(language));

describe('the words for an answer', () => {
  it('says a small spend fits inside today and leaves tomorrow alone', () => {
    const card = words({ kind: 'afford', amount: 40_000 });
    expect(card.text).toBe('Yes, easily. It fits inside today’s 49k, so tomorrow doesn’t change.');
    expect(card.mood).toBe('happy');
    expect(card.bars).toEqual({
      nowValue: '353k a day',
      afterValue: '353k a day',
      afterPercent: 100,
    });
    expect(card.rows).toEqual([
      { key: 'Safe today', value: '49.000₫' },
      { key: 'This', value: '− 40.000₫' },
      { key: 'Tomorrow', value: '353.000₫' },
    ]);
  });

  it('spreads a bigger spend over the days left, with the working underneath', () => {
    const card = words({ kind: 'afford', amount: 500_000 });
    expect(card.text).toBe('Yes. The days after go from 353k to 331k until payday.');
    expect(card.bars).toMatchObject({ afterValue: '331k a day', afterPercent: 94 });
    expect(card.rows).toEqual([
      { key: 'Free until payday', value: '7.783.000₫' },
      { key: 'This', value: '− 500.000₫' },
      { key: 'Left, per day', value: '331.000₫' },
    ]);
    expect(card.note).toBeNull();
  });

  it('calls a spend tight and offers money back from the pots', () => {
    const card = words({ kind: 'afford', amount: 4_000_000 });
    expect(card.text).toBe('You can, but it’s tight: the days after drop from 353k to 171k.');
    expect(card.mood).toBe('nod');
    expect(card.note).toBe('Taking 1M from your pots would keep 217k a day.');
  });

  it('says not this month, names payday and shows an empty After bar', () => {
    const card = words({ kind: 'afford', amount: 9_000_000 });
    expect(card.text).toBe(
      'Not this month. That’s more than all your free money. It fits after payday on 31 October.',
    );
    expect(card.bars).toEqual({
      nowValue: '353k a day',
      afterValue: 'nothing left',
      afterPercent: 3,
    });
    expect(card.rows[2]).toEqual({ key: 'Left, per day', value: '0₫' });
    expect(card.note).toBe('Or take part of it from a pot.');
    expect(
      words({ kind: 'afford', amount: 9_000_000 }, 'en', { ...ctx, pots: [] }).note,
    ).toBeNull();
  });

  it('adds up the weekend days that are still to come', () => {
    const card = words({ kind: 'weekend' });
    expect(card.text).toBe(
      'About 706k across Saturday and Sunday, if the days before stay on plan.',
    );
    expect(card.rows).toEqual([
      { key: 'Saturday', value: '353.000₫' },
      { key: 'Sunday', value: '353.000₫' },
    ]);
  });

  it('handles a weekend that payday comes before, and one with a single day left', () => {
    const early = words({ kind: 'weekend' }, 'en', { ...ctx, daysLeft: 0 });
    expect(early.text).toBe(
      'Payday on 31 October comes before the weekend, so a fresh number starts then.',
    );
    expect(early.rows).toEqual([]);
    const one = words({ kind: 'weekend' }, 'en', { ...ctx, daysLeft: 1, today: '2026-10-10' });
    expect(one.text).toBe('About 353k on Sunday, if the days before stay on plan.');
  });

  it('says what saving more costs a day, and when it costs nothing', () => {
    const card = words({ kind: 'saveMore', amount: 500_000 });
    expect(card.text).toBe(
      'Moving 500k more to Future you would cost about 22k a day until payday.',
    );
    expect(card.note).toBe('You can do this from Plan.');
    expect(card.rows[0]).toEqual({ key: 'Future you each month', value: '2.000.000₫' });
    expect(words({ kind: 'saveMore', amount: 1_000 }).text).toBe(
      'Moving 1k more to Future you would barely change your days.',
    );
  });

  it('says when a pot fills, that it is full, or that nothing goes in', () => {
    expect(words({ kind: 'potFull', pot: 'tết' }).text).toBe(
      'At 450k a month, the Tết pot fills by February 2027.',
    );
    const full = { ...ctx, pots: [{ name: 'Tết', goal: 1_000_000, saved: 1_000_000, monthly: 0 }] };
    expect(words({ kind: 'potFull' }, 'en', full).text).toBe('The Tết pot is already full.');
    const idle = { ...ctx, pots: [{ name: 'Tết', goal: 3_000_000, saved: 0, monthly: 0 }] };
    expect(words({ kind: 'potFull' }, 'en', idle).text).toBe(
      'Nothing goes into the Tết pot each month right now, so it won’t fill by itself.',
    );
    expect(words({ kind: 'potFull' }, 'en', { ...ctx, pots: [] }).text).toContain('no pot yet');
  });

  it('answers today’s question and the one it cannot read', () => {
    expect(words({ kind: 'today' }).text).toBe(
      'You can spend 49k today. Tomorrow’s number is 353k.',
    );
    const used = { ...ctx, day: { ...day, safe: -20_000 } };
    expect(words({ kind: 'today' }, 'en', used).text).toBe(
      'Today’s number is used up. Tomorrow’s is 353k.',
    );
    expect(words({ kind: 'unknown' }).note).toBeNull();
    expect(words({ kind: 'unknown' }, 'en', ctx, true).note).toBe(
      'I couldn’t reach the server, so I only read simple questions right now.',
    );
  });

  it('is written in Vietnamese too, with the same numbers', () => {
    const card = words({ kind: 'afford', amount: 500_000 }, 'vi');
    expect(card.text).toBe('Được. Những ngày sau từ 353k còn 331k đến ngày lương.');
    expect(card.bars?.nowValue).toBe('353k/ngày');
    expect(words({ kind: 'weekend' }, 'vi').text).toContain('Thứ Bảy và Chủ Nhật');
    expect(words({ kind: 'afford', amount: 4_000_000 }, 'vi').note).toContain('1tr');
  });
});
