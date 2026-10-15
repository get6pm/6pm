import { describe, expect, it } from '@jest/globals';

import { spendCategoryOf } from './ask-spend-category';

const categories = [
  { id: 'food', name: 'Ăn uống' },
  { id: 'drinks', name: 'Cà phê' },
  { id: 'transport', name: 'Đi lại' },
];

describe('spendCategoryOf', () => {
  it('follows a rule the user taught 6pm first', () => {
    expect(
      spendCategoryOf({ name: 'Phở', named: 'Cà phê', learned: 'transport', hour: 12 }, categories),
    ).toBe('transport');
  });

  it('then a category the question named, then what the words point to', () => {
    expect(
      spendCategoryOf({ name: 'Phở', named: 'cà phê', learned: null, hour: 12 }, categories),
    ).toBe('drinks');
    expect(
      spendCategoryOf({ name: 'Grab về nhà', named: null, learned: null, hour: 12 }, categories),
    ).toBe('transport');
  });

  it('falls back to a category the user still has', () => {
    expect(spendCategoryOf({ name: 'Thứ gì đó', named: null, learned: null, hour: 3 }, [])).toBe(
      'food',
    );
  });
});
