import { describe, expect, it } from 'vitest';

import type { AskQuery } from './ask-query';
import { readQuery } from './read-query';

const vi = {
  pots: ['Mua nhà', 'Đà Lạt'],
  categories: ['Ăn uống', 'Cà phê', 'Đi lại', 'Mua sắm'],
  merchants: ['Grab', 'Highlands Coffee', 'Circle K'],
};
const en = {
  pots: ['Wedding'],
  categories: ['Food', 'Coffee', 'Transport', 'Shopping'],
  merchants: ['Grab', 'Highlands'],
};

/** Questions people ask, with what each must read as. */
const cases: readonly (readonly [string, typeof vi, AskQuery])[] = [
  // Goals months or years away.
  ['Khi nào tôi mua được nhà', { ...vi, pots: [] }, { kind: 'goal', what: 'nhà' }],
  [
    'bao giờ mua được nhà 3 tỷ',
    { ...vi, pots: [] },
    { kind: 'goal', what: 'nhà', amount: 3_000_000_000 },
  ],
  ['Khi nào tôi mua được nhà', vi, { kind: 'potFull', pot: 'Mua nhà' }],
  ['bao giờ đủ tiền cưới', vi, { kind: 'goal', what: 'cưới' }],
  ['When can I buy a car?', en, { kind: 'goal', what: 'a car' }],
  ['how long to save for a 500tr car', en, { kind: 'goal', what: 'a car', amount: 500_000_000 }],
  ['how long until the wedding is covered', en, { kind: 'potFull', pot: 'Wedding' }],
  // Read wrong or not at all before.
  ['dạo này mình thế nào', vi, { kind: 'howAmIDoing' }],
  ['mấy hóa đơn còn lại tháng này', vi, { kind: 'bills' }],
  [
    'liệt kê mấy lần đi Grab tuần trước',
    vi,
    { kind: 'list', range: { preset: 'lastWeek' }, merchant: 'Grab' },
  ],
  ['cuối tuần đi Đà Lạt 3 triệu được không', vi, { kind: 'afford', amount: 3_000_000 }],
  [
    'show my spends over 500k this month',
    en,
    { kind: 'list', range: { preset: 'thisMonth' }, minAmount: 500_000 },
  ],
  [
    'grab more than last month?',
    en,
    {
      kind: 'compare',
      range: { preset: 'thisMonth' },
      against: { preset: 'lastMonth' },
      merchant: 'Grab',
    },
  ],
  [
    'những khoản trên 1tr5 tháng này',
    vi,
    { kind: 'list', range: { preset: 'thisMonth' }, minAmount: 1_500_000 },
  ],
  // Kept as they were.
  [
    'tháng này so với tháng trước ăn uống thế nào',
    vi,
    {
      kind: 'compare',
      range: { preset: 'thisMonth' },
      against: { preset: 'lastMonth' },
      category: 'Ăn uống',
    },
  ],
  [
    'mình tiêu nhiều nhất vào đâu tháng này',
    vi,
    { kind: 'breakdown', range: { preset: 'thisMonth' } },
  ],
];

describe('readQuery, more questions', () => {
  it.each(cases)('%s', (question, names, query) => {
    expect(readQuery(question, names)).toEqual(query);
  });
});

describe('readQuery, follow-ups', () => {
  it('takes a bare amount as the price of a goal asked without one', () => {
    expect(readQuery('3 tỷ', vi, { kind: 'goal', what: 'nhà' })).toEqual({
      kind: 'goal',
      what: 'nhà',
      amount: 3_000_000_000,
    });
  });

  it('moves the span of the last question', () => {
    const before: AskQuery = { kind: 'spend', range: { preset: 'thisWeek' }, category: 'Cà phê' };
    expect(readQuery('còn tháng trước?', vi, before)).toEqual({
      ...before,
      range: { preset: 'lastMonth' },
    });
    expect(readQuery('what about last month?', en, before)).toEqual({
      ...before,
      range: { preset: 'lastMonth' },
    });
  });

  it('reads a new question as new, whatever came before', () => {
    const before: AskQuery = { kind: 'spend', range: { preset: 'thisWeek' } };
    expect(readQuery('Can I afford 2tr on Saturday?', en, before)).toEqual({
      kind: 'afford',
      amount: 2_000_000,
    });
  });
});
