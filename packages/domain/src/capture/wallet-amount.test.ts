import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

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
  ])('reads %j as %s %i', (text, currency, amount) => {
    expect(parseWalletAmount(text)).toEqual({ currency, amount });
  });

  it.each([['0.0'], [''], ['   '], ['0'], ['₫0'], ['Amount'], ['VND']])(
    'has nothing readable in %j',
    (text) => {
      expect(parseWalletAmount(text)).toBeNull();
    },
  );

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
  ])('reads %j as %d', (raw, value) => {
    expect(readPrintedNumber(raw)).toBe(value);
  });

  it.each([['1.2.3'], ['45,'], ['abc'], ['']])('cannot read %j', (raw) => {
    expect(readPrintedNumber(raw)).toBeNull();
  });
});
