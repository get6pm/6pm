import { describe, expect, it } from '@jest/globals';

import {
  contextualStrings,
  offersLocale,
  speechLocale,
  spokenCategory,
  spokenChips,
} from './voice-support';

describe('speechLocale', () => {
  it('follows the app language', () => {
    expect(speechLocale('vi')).toBe('vi-VN');
    expect(speechLocale('en')).toBe('en-US');
  });
});

describe('offersLocale', () => {
  it('accepts the identifier spellings iOS uses', () => {
    expect(offersLocale(['en-US', 'vi-VN'], 'vi-VN')).toBe(true);
    expect(offersLocale(['vi_VN'], 'vi-VN')).toBe(true);
    expect(offersLocale(['vi'], 'vi-VN')).toBe(true);
  });

  it('refuses a language the recogniser does not list', () => {
    expect(offersLocale(['en-US', 'en-GB', 'fr-FR'], 'vi-VN')).toBe(false);
    expect(offersLocale([], 'en-US')).toBe(false);
  });
});

describe('contextualStrings', () => {
  it('adds the amount words to the category names once', () => {
    expect(contextualStrings(['Food', 'Drinks', 'k'])).toEqual([
      'Food',
      'Drinks',
      'k',
      'nghìn',
      'triệu',
    ]);
  });
});

describe('spokenCategory', () => {
  const ids = new Set(['food', 'drinks', 'rent']);
  const tea = { name: 'Trà sữa', amount: 45_000, categoryHint: 'drinks' as const };

  it('prefers what the user taught 6pm, then the words', () => {
    expect(spokenCategory(tea, 'rent', ids)).toBe('rent');
    expect(spokenCategory(tea, null, ids)).toBe('drinks');
  });

  it('leaves the pick alone when the hinted category is gone or nothing matched', () => {
    expect(spokenCategory({ ...tea, categoryHint: 'groceries' }, null, ids)).toBeNull();
    expect(spokenCategory({ ...tea, categoryHint: null }, null, ids)).toBeNull();
  });
});

describe('spokenChips', () => {
  it('shows name, amount and category', () => {
    expect(
      spokenChips({ name: 'Trà sữa', amount: 45_000, categoryHint: 'drinks' }, 'Drinks'),
    ).toEqual(['Trà sữa', '45.000₫', 'Drinks']);
  });

  it('shows only what was heard', () => {
    expect(spokenChips({ name: '', amount: 20_000, categoryHint: null }, null)).toEqual([
      '20.000₫',
    ]);
    expect(spokenChips({ name: 'Phở', amount: null, categoryHint: 'food' }, 'Food')).toEqual([
      'Phở',
      'Food',
    ]);
  });
});
