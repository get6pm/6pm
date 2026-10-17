import { describe, expect, it } from '@jest/globals';

import { currencyOf, formatVnd, parseSpokenSpend, VND } from '@6pm/domain';

import {
  contextualStrings,
  hearsOnPhone,
  offersLocale,
  speechLocale,
  spendIn,
  spokenCategory,
  spokenChips,
} from './voice-support';

const vnd = { full: formatVnd };

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

describe('hearsOnPhone', () => {
  const vi = { locales: ['en-US', 'vi-VN'], installedLocales: ['en-US'] };

  it('takes any language iOS lists', () => {
    expect(
      hearsOnPhone({ os: 'ios', apiLevel: 0, onDevice: true, supported: vi, locale: 'vi-VN' }),
    ).toBe(true);
  });

  it('takes only a downloaded language on Android', () => {
    const base = { os: 'android', apiLevel: 36, onDevice: true, supported: vi } as const;
    expect(hearsOnPhone({ ...base, locale: 'en-US' })).toBe(true);
    expect(hearsOnPhone({ ...base, locale: 'vi-VN' })).toBe(false);
  });

  it('never uses an Android recogniser that may send the audio away', () => {
    const supported = { locales: ['vi-VN'], installedLocales: ['vi-VN'] };
    expect(
      hearsOnPhone({ os: 'android', apiLevel: 32, onDevice: true, supported, locale: 'vi-VN' }),
    ).toBe(false);
  });

  it('refuses when the phone has no on-device recognition', () => {
    const supported = { locales: ['vi-VN'], installedLocales: ['vi-VN'] };
    expect(
      hearsOnPhone({ os: 'ios', apiLevel: 0, onDevice: false, supported, locale: 'vi-VN' }),
    ).toBe(false);
    expect(
      hearsOnPhone({ os: 'android', apiLevel: 36, onDevice: false, supported, locale: 'vi-VN' }),
    ).toBe(false);
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
  const drinks = { name: 'Drinks', icon: 'local_cafe' };

  it('shows name, amount and category, the name with its category icon', () => {
    expect(
      spokenChips({ name: 'Trà sữa', amount: 45_000, categoryHint: 'drinks' }, drinks, vnd),
    ).toEqual([
      { icon: 'local_cafe', label: 'Trà sữa' },
      { icon: 'payments', label: '45.000₫' },
      { icon: 'category', label: 'Drinks' },
    ]);
  });

  it('shows only what was heard', () => {
    expect(spokenChips({ name: '', amount: 20_000, categoryHint: null }, null, vnd)).toEqual([
      { icon: 'payments', label: '20.000₫' },
    ]);
    expect(
      spokenChips(
        { name: 'Phở', amount: null, categoryHint: 'food' },
        { name: 'Food', icon: 'x' },
        vnd,
      ),
    ).toEqual([
      { icon: 'receipt_long', label: 'Phở' },
      { icon: 'category', label: 'Food' },
    ]);
  });
});

describe('spendIn', () => {
  it('keeps đồng as the words read', () => {
    const spend = parseSpokenSpend('phở forty-five k');
    expect(spendIn(spend, 'phở forty-five k', VND)).toBe(spend);
  });

  it('reads the amount in the home currency', () => {
    const usd = currencyOf('USD');
    const text = 'lunch twelve dollars';
    const spend = spendIn(parseSpokenSpend(text), text, usd);
    expect(spend.name).toBe(parseSpokenSpend(text).name);
    expect(spend.amount).toBe(1200);
    expect(spendIn(parseSpokenSpend('taxi 45 k'), 'taxi 45 k', usd).amount).toBe(4_500_000);
  });
});
