import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { currencyOf } from '../money/currency';
import { formatVnd } from '../money/format';
import { parseWalletAmount, readPrintedNumber } from './wallet-amount';

describe('parseWalletAmount', () => {
  it.each([
    ['₫45,000', 'VND', 45_000],
    ['45.000 ₫', 'VND', 45_000],
    ['VND 45,000.00', 'VND', 45_000],
    ['45000', 'VND', 45_000],
    ['45.000₫', 'VND', 45_000],
    ['45,000 VNĐ', 'VND', 45_000],
    ['120.000 đ', 'VND', 120_000],
    ['-120,000 VND', 'VND', 120_000],
    ['1,250,000đ', 'VND', 1_250_000],
    ['45 000 ₫', 'VND', 45_000],
    ['45 000 ₫', 'VND', 45_000],
    ['$3.50', 'USD', 350],
    ['US$12', 'USD', 1_200],
    ['€12,50', 'EUR', 1_250],
    ['¥1,200', 'JPY', 1_200],
    ['฿150.00', 'THB', 15_000],
    ['S$4.20', 'SGD', 420],
    ['NT$120', 'TWD', 120],
    ['HK$45.00', 'HKD', 4_500],
    ['CN¥12.50', 'CNY', 1_250],
    ['RMB 12.50', 'CNY', 1_250],
    ['RM12.50', 'MYR', 1_250],
    ['MYR 12.50', 'MYR', 1_250],
    ['Rp496.650', 'IDR', 496_650],
    ['IDR 496,650', 'IDR', 496_650],
    ['₱250.00', 'PHP', 25_000],
    ['CHF 8.50', 'CHF', 850],
    ['8.50 CHF', 'CHF', 850],
    ['CA$20', 'CAD', 2_000],
    ['₹1,299', 'INR', 129_900],
    ['KWD 1.250', 'KWD', 1_250],
    ['1.250 KD', 'KWD', 1_250],
    ['$0.500', 'USD', 50],
  ])('reads %j as %s %i', (text, currency, amount) => {
    expect(parseWalletAmount(text)).toEqual({ currency, amount });
  });

  it.each([['0.0'], [''], ['   '], ['0'], ['₫0'], ['Amount'], ['VND']])(
    'has nothing readable in %j',
    (text) => {
      expect(parseWalletAmount(text)).toBeNull();
    },
  );

  it.each([['XYZ12'], ['₲5000'], ['12XQ']])('names no currency it cannot read in %j', (text) => {
    expect(parseWalletAmount(text)).toBeNull();
  });

  it('reads a bare symbol home writes as home', () => {
    expect(parseWalletAmount('$12', currencyOf('CAD'))).toEqual({ currency: 'CAD', amount: 1_200 });
    expect(parseWalletAmount('¥1,200', currencyOf('CNY'))).toEqual({
      currency: 'CNY',
      amount: 120_000,
    });
    expect(parseWalletAmount('£4.50', currencyOf('GBP'))).toEqual({ currency: 'GBP', amount: 450 });
    expect(parseWalletAmount('NT$120', currencyOf('USD'))).toEqual({
      currency: 'TWD',
      amount: 120,
    });
  });

  it('takes a bare number as written, not as thousands', () => {
    expect(parseWalletAmount('45')).toEqual({ currency: 'VND', amount: 45 });
  });

  it('reads back every amount 6pm prints', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10_000_000_000 }), (amount) => {
        expect(parseWalletAmount(formatVnd(amount))).toEqual({ currency: 'VND', amount });
      }),
    );
  });

  it('reads amounts as Wallet prints them in English and Vietnamese', () => {
    const en = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' });
    const vi = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000_000 }), (amount) => {
        expect(parseWalletAmount(en.format(amount))).toEqual({ currency: 'VND', amount });
        expect(parseWalletAmount(vi.format(amount))).toEqual({ currency: 'VND', amount });
      }),
    );
  });

  it('never throws on anything', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const read = parseWalletAmount(text);
        if (read) expect(Number.isSafeInteger(read.amount) && read.amount > 0).toBe(true);
      }),
    );
  });
});

describe('readPrintedNumber', () => {
  it.each([
    ['45,000.00', 45_000],
    ['45.000,00', 45_000],
    ['1.250.000', 1_250_000],
    ['1,250,000', 1_250_000],
    ['3.50', 3.5],
    ['3,5', 3.5],
    ['0.0', 0],
    ['1234.5', 1234.5],
    ['0.500', 0.5],
    ['0,250', 0.25],
  ])('reads %j as %d', (raw, value) => {
    expect(readPrintedNumber(raw)).toBe(value);
  });

  it('reads one lone .ddd as thousandths in a three-decimal currency', () => {
    expect(readPrintedNumber('1.250', 3)).toBe(1.25);
    expect(readPrintedNumber('1,250', 3)).toBe(1.25);
    expect(readPrintedNumber('1.250.000', 3)).toBe(1_250_000);
    expect(readPrintedNumber('1.250', 2)).toBe(1250);
  });

  it.each([['1.2.3'], ['45,'], ['abc'], ['']])('cannot read %j', (raw) => {
    expect(readPrintedNumber(raw)).toBeNull();
  });
});
