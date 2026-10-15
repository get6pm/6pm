import { describe, expect, it } from '@jest/globals';

import { currencyOf, moneyFormat, moneyLocale, VND } from '@6pm/domain';

import { homeDecimalMark, shortParts, typedText } from './typed-amount';

const vnd = moneyFormat(moneyLocale(VND, 'vi', { languageTag: 'vi-VN', decimal: ',', group: '.' }));
const usd = moneyFormat(
  moneyLocale(currencyOf('USD'), 'en', { languageTag: 'en-US', decimal: '.', group: ',' }),
);
const eur = moneyFormat(
  moneyLocale(currencyOf('EUR'), 'en', { languageTag: 'de-DE', decimal: ',', group: '.' }),
);

describe('typedText', () => {
  it('writes đồng as it always has', () => {
    expect(typedText('', vnd)).toBe('0₫');
    expect(typedText('45000', vnd)).toBe('45.000₫');
  });

  it('keeps the decimals as typed so far', () => {
    expect(typedText('1234', usd)).toBe('$1,234');
    expect(typedText('12.', usd)).toBe('$12.');
    expect(typedText('12.5', usd)).toBe('$12.5');
    expect(typedText('0.05', usd)).toBe('$0.05');
    expect(typedText('12.5', eur)).toBe('12,5\u00a0€');
  });
});

describe('homeDecimalMark', () => {
  it('has a mark only for a currency with decimals', () => {
    expect(homeDecimalMark(vnd)).toBeUndefined();
    expect(homeDecimalMark(usd)).toBe('.');
    expect(homeDecimalMark(eur)).toBe(',');
  });
});

describe('shortParts', () => {
  it('splits the symbol from the short form', () => {
    expect(shortParts(1_740_000, usd)).toEqual({
      sign: '',
      prefix: '$',
      number: '17.4k',
      suffix: '',
    });
    expect(shortParts(353_000, vnd)).toEqual({ sign: '', prefix: '', number: '353k', suffix: '' });
  });
});
