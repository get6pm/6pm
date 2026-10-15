import { describe, expect, it } from '@jest/globals';

import { t, type Language } from '@6pm/i18n';

import { describeLedgerAnswer, type LedgerWordsEnv } from './ask-ledger-words';

const lookUp = t as unknown as (
  language: Language,
  key: string,
  params?: Readonly<Record<string, string | number>>,
) => string;

function env(language: Language): LedgerWordsEnv {
  const categoryName = (id: string) => ({ drinks: 'Cà phê', food: 'Ăn uống' })[id] ?? id;
  const say = (key: string, params?: Readonly<Record<string, string | number>>) =>
    lookUp(language, key, params);
  return {
    t: say,
    language,
    monthLong: (m) => m,
    dayLongMonth: (d) => d.slice(5),
    weekday: (d) => d,
    categoryName,
    voice: 'plain',
    slotWords: { language, say, categoryName, dayMonth: (d) => String(d.getDate()) },
  };
}

const week = { from: '2026-10-05', to: '2026-10-09', preset: 'thisWeek' } as const;

describe('describeLedgerAnswer', () => {
  it('says what a category cost over a span, with a model’s values to word it from', () => {
    const { card, wording } = describeLedgerAnswer(
      {
        kind: 'spent',
        spent: { range: week, total: 124_000, count: 2 },
        categoryId: 'drinks',
        merchant: null,
        places: [],
        partial: false,
      },
      env('en'),
    );
    expect(card.text).toBe('You spent 124k on Cà phê this week, 2 times.');
    expect(wording?.values).toEqual({
      total: '124k',
      range: 'this week',
      count: '2',
      category: 'Cà phê',
    });
  });

  it('says plainly when nothing matched, and needs no model', () => {
    const { card, wording } = describeLedgerAnswer(
      {
        kind: 'spent',
        spent: { range: week, total: 0, count: 0 },
        categoryId: null,
        merchant: 'Circle K',
        places: [],
        partial: false,
      },
      env('vi'),
    );
    expect(card.text).toBe('Không có khoản nào ở Circle K tuần này.');
    expect(wording).toBeNull();
  });

  it('compares two spans with a row for each, and notes records that start late', () => {
    const { card } = describeLedgerAnswer(
      {
        kind: 'compared',
        now: { range: week, total: 300_000, count: 3 },
        before: {
          range: { from: '2026-09-28', to: '2026-10-02', preset: 'lastWeek' },
          total: 200_000,
          count: 2,
        },
        compare: 'more',
        categoryId: null,
        merchant: null,
        partial: true,
      },
      env('en'),
    );
    expect(card.text).toBe('That’s 300k this week, up from 200k last week.');
    expect(card.rows).toEqual([
      { key: 'This week', value: '300.000₫' },
      { key: 'Last week', value: '200.000₫' },
    ]);
    expect(card.note).toBe('This counts what 6pm has kept since 09-28.');
  });

  it('lists spends newest first and says how many more there are', () => {
    const { card } = describeLedgerAnswer(
      {
        kind: 'listed',
        range: week,
        spends: [
          { id: 'a', day: '2026-10-09', merchant: 'Circle K', amount: 45_000, categoryId: 'food' },
        ],
        more: 2,
        total: 150_000,
        partial: false,
      },
      env('en'),
    );
    expect(card.text).toBe('3 spends this week, 150k in all.');
    expect(card.rows).toEqual([{ key: 'Circle K · 10-09', value: '45.000₫' }]);
    expect(card.note).toBe('And 2 more.');
  });

  it('answers small talk without looking anything up', () => {
    expect(
      describeLedgerAnswer({ kind: 'chat', topic: null, fact: null }, env('vi')).card.text,
    ).toBe('Có gì cứ hỏi mình nha, lúc nào cũng được.');
  });

  it('counts a big goal in years at what goes to Future you, and asks a price when none was said', () => {
    const { card } = describeLedgerAnswer(
      {
        kind: 'goalPace',
        what: 'nhà',
        amount: 3_000_000_000,
        monthly: 4_000_000,
        months: 750,
        years: 63,
        reachedIn: '2089-04',
      },
      env('vi'),
    );
    expect(card.text).toContain('khoảng 63 năm');
    expect(card.text).toContain('3 tỷ');
    expect(card.rows.map((r) => r.key)).toEqual(['Mục tiêu', 'Mỗi tháng', 'Khoảng']);
    expect(describeLedgerAnswer({ kind: 'goalAmount', what: 'a car' }, env('en')).card.text).toBe(
      'Roughly how much is a car? Tell me the price, like “3 tỷ”, and I’ll count it out.',
    );
  });
});
