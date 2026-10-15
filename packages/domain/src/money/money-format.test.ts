import { describe, expect, it } from 'vitest';

import { currencyOf, VND } from './currency';
import { formatShort, formatVnd } from './format';
import { moneyFormat, moneyLocale, vndLocale } from './money-format';

const NBSP = ' ';
const us = moneyFormat(moneyLocale(currencyOf('USD'), 'en', { languageTag: 'en-US' }));
const de = moneyFormat(
  moneyLocale(currencyOf('EUR'), 'en', { languageTag: 'de-DE', decimal: ',', group: '.' }),
);
const jp = moneyFormat(moneyLocale(currencyOf('JPY'), 'en', { languageTag: 'ja-JP' }));
const id = moneyFormat(
  moneyLocale(currencyOf('IDR'), 'en', { languageTag: 'id-ID', decimal: ',', group: '.' }),
);

describe('moneyFormat in đồng', () => {
  it('writes exactly what the design writes, in either language', () => {
    for (const language of ['en', 'vi'] as const) {
      const vnd = moneyFormat(vndLocale(language));
      for (const amount of [0, 49_000, 17_400_000, -1_250_000, 999_500, 1_250_000_000]) {
        expect(vnd.full(amount)).toBe(formatVnd(amount));
        expect(vnd.short(amount)).toBe(formatShort(amount, language));
      }
    }
  });

  it('is the same from the phone locale, whatever the phone writes numbers like', () => {
    const vnd = moneyFormat(moneyLocale(VND, 'en', { languageTag: 'en-US' }));
    expect(vnd.full(49_000)).toBe('49.000₫');
    expect(vnd.parts(-49_000)).toEqual({ sign: '−', prefix: '', number: '49.000', suffix: '₫' });
    expect(vnd.spoken(49_000)).toBe('49.000 đồng');
  });
});

describe('moneyFormat elsewhere', () => {
  it('puts the dollar first and shows cents only when there are some', () => {
    expect(us.full(1_200)).toBe('$12');
    expect(us.full(350)).toBe('$3.50');
    expect(us.full(123_456_7)).toBe('$12,345.67');
    expect(us.full(-1_250)).toBe('−$12.50');
    expect(us.number(123_456_700)).toBe('1,234,567');
  });

  it('writes euros the German way', () => {
    expect(de.full(1_250)).toBe(`12,50${NBSP}€`);
    expect(de.full(123_400)).toBe(`1.234${NBSP}€`);
    expect(de.parts(-1_250)).toEqual({
      sign: '−',
      prefix: '',
      number: '12,50',
      suffix: `${NBSP}€`,
    });
  });

  it('keeps yen and rupiah whole, and spaces a symbol made of letters', () => {
    expect(jp.full(1_234_567)).toBe('¥1,234,567');
    expect(id.full(25_000)).toBe(`Rp${NBSP}25.000`);
  });

  it('writes the short form in steps, then k and M', () => {
    expect(us.short(35_300)).toBe('$353');
    expect(us.short(35_349)).toBe('$353');
    expect(us.short(999_900)).toBe('$9,999');
    expect(us.short(1_250_000)).toBe('$12.5k');
    expect(us.short(12_500_000)).toBe('$125k');
    expect(us.short(120_000_000)).toBe('$1.2M');
    expect(us.short(125_000_000_000)).toBe('$1.25B');
    expect(us.short(-600)).toBe('−$6');
    expect(us.short(0)).toBe('$0');
    expect(de.short(1_740_000)).toBe(`17,4k${NBSP}€`);
    expect(jp.short(3_530)).toBe('¥3,530');
    expect(jp.short(353_000)).toBe('¥353k');
  });

  it('says millions as tr in Vietnamese', () => {
    const vi = moneyFormat(moneyLocale(currencyOf('USD'), 'vi', { languageTag: 'en-US' }));
    expect(vi.short(120_000_000)).toBe('$1.2tr');
  });
});

describe('moneyLocale', () => {
  it('reads the symbol position from the language, Brazil aside', () => {
    expect(moneyLocale(currencyOf('EUR'), 'en', { languageTag: 'fr-FR' }).symbolAfter).toBe(true);
    expect(moneyLocale(currencyOf('EUR'), 'en', { languageTag: 'nl-NL' }).symbolAfter).toBe(false);
    expect(moneyLocale(currencyOf('BRL'), 'en', { languageTag: 'pt-BR' }).symbolAfter).toBe(false);
    expect(moneyLocale(currencyOf('USD'), 'en').symbolAfter).toBe(false);
  });

  it('never groups with the decimal mark', () => {
    const odd = moneyLocale(currencyOf('EUR'), 'en', { decimal: ',', group: ',' });
    expect(odd.group).toBe('.');
  });
});
