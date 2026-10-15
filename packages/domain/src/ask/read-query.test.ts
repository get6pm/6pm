import { describe, expect, it } from 'vitest';

import type { AskQuery } from './ask-query';
import { readQuery } from './read-query';

const names = {
  pots: ['Tết & lì xì', 'Đà Lạt'],
  categories: ['Food', 'Drinks', 'Transport', 'Ăn uống', 'Cà phê', 'Đi lại'],
};

/** Real phrasings, English and Vietnamese, with what each must read as. */
const golden: readonly (readonly [string, AskQuery])[] = [
  // The original six keep their reading.
  ['Can I afford 2tr on Saturday?', { kind: 'afford', amount: 2_000_000 }],
  ['mua giày 1tr5 được không', { kind: 'afford', amount: 1_500_000 }],
  ['How much can I spend this weekend?', { kind: 'weekend' }],
  ['cuối tuần tiêu bao nhiêu', { kind: 'weekend' }],
  ['What if I save 1tr more?', { kind: 'saveMore', amount: 1_000_000 }],
  ['When is Đà Lạt full?', { kind: 'potFull', pot: 'Đà Lạt' }],
  ['How much can I spend today?', { kind: 'today' }],
  ['hôm nay tiêu được bao nhiêu', { kind: 'today' }],
  // What was spent.
  ['How much did I spend today?', { kind: 'spend', range: { preset: 'today' } }],
  ['hôm nay tiêu bao nhiêu rồi', { kind: 'spend', range: { preset: 'today' } }],
  [
    'How much have I spent on drinks this month?',
    { kind: 'spend', range: { preset: 'thisMonth' }, category: 'Drinks' },
  ],
  [
    'tháng này cà phê hết bao nhiêu',
    { kind: 'spend', range: { preset: 'thisMonth' }, category: 'Cà phê' },
  ],
  [
    'How much at Highlands last week?',
    { kind: 'spend', range: { preset: 'lastWeek' }, merchant: 'Highlands' },
  ],
  ['tuần trước xài bao nhiêu', { kind: 'spend', range: { preset: 'lastWeek' } }],
  ['how much did i spend', { kind: 'spend', range: { preset: 'thisCycle' } }],
  // Where it went.
  ['Where did my money go last week?', { kind: 'breakdown', range: { preset: 'lastWeek' } }],
  ['tháng này tiền đi đâu hết vậy', { kind: 'breakdown', range: { preset: 'thisMonth' } }],
  // Comparisons.
  [
    'Am I spending more on transport than last month?',
    {
      kind: 'compare',
      range: { preset: 'thisMonth' },
      against: { preset: 'lastMonth' },
      category: 'Transport',
    },
  ],
  [
    'this week vs last week',
    { kind: 'compare', range: { preset: 'thisWeek' }, against: { preset: 'lastWeek' } },
  ],
  [
    'so sánh tháng này với tháng trước',
    { kind: 'compare', range: { preset: 'thisMonth' }, against: { preset: 'lastMonth' } },
  ],
  // Lists.
  [
    'What did I buy at Circle K this week?',
    { kind: 'list', range: { preset: 'thisWeek' }, merchant: 'Circle K' },
  ],
  ['liệt kê các khoản hôm qua', { kind: 'list', range: { preset: 'yesterday' } }],
  // Bills, how am I doing, chat.
  ['What bills are left before payday?', { kind: 'bills' }],
  ['hoá đơn nào sắp đến hạn', { kind: 'bills' }],
  ['How am I doing?', { kind: 'howAmIDoing' }],
  ['tháng này mình ổn không', { kind: 'howAmIDoing' }],
  ['thanks!', { kind: 'chat' }],
  ['cảm ơn nha', { kind: 'chat' }],
  // Not understood.
  ['What is the meaning of life?', { kind: 'unknown' }],
];

describe('readQuery', () => {
  it.each(golden)('%s', (question, query) => {
    expect(readQuery(question, names)).toEqual(query);
  });

  it('matches the longest category name the question holds', () => {
    expect(
      readQuery('how much on đi lại this week', { categories: ['Đi', 'Đi lại'] }),
    ).toMatchObject({ category: 'Đi lại' });
  });

  it('keeps a spend question that names its place about that place', () => {
    expect(readQuery('how much did I spend at Phở Hòa?')).toEqual({
      kind: 'spend',
      range: { preset: 'thisCycle' },
      merchant: 'Phở Hòa',
    });
  });
});
