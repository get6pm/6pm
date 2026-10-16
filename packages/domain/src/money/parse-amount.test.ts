import { describe, expect, it } from 'vitest';

import { currencyOf } from './currency';
import { parseAmount } from './parse-amount';

describe('parseAmount', () => {
  it.each([
    ['45k', 45_000],
    ['45 k', 45_000],
    ['45 nghìn', 45_000],
    ['45 ngàn', 45_000],
    ['45.000', 45_000],
    ['45.000₫', 45_000],
    ['1.250.000đ', 1_250_000],
    ['35', 35_000],
    ['trà sữa 45k', 45_000],
    ['1tr2', 1_200_000],
    ['1tr25', 1_250_000],
    ['1,5tr', 1_500_000],
    ['2tr', 2_000_000],
    ['2 triệu', 2_000_000],
    ['2 triệu rưỡi', 2_500_000],
    ['45 nghìn rưỡi', 45_500],
    ['Can I afford a 2tr dinner Saturday?', 2_000_000],
    ['Can I afford a 2M dinner Saturday?', 2_000_000],
    ['1.4M', 1_400_000],
    ['What if I buy a 450k jacket?', 450_000],
    ['1 củ', 1_000_000],
    ['nhà 3 tỷ', 3_000_000_000],
    ['3 tỉ', 3_000_000_000],
    ['1ty2', 1_200_000_000],
    ['2 tỷ rưỡi', 2_500_000_000],
    ['a 1.5bn flat', 1_500_000_000],
    ['35 tiền', 35_000],
  ])('%s → %d', (text, expected) => {
    expect(parseAmount(text)).toBe(expected);
  });

  it('does not read a dish as a unit', () => {
    expect(parseAmount('45 mì')).toBe(45_000);
    expect(parseAmount('2 mins')).toBe(2_000);
  });

  it('returns null when there is no number', () => {
    expect(parseAmount('phở with extra beef')).toBeNull();
  });

  it('returns null for an amount too large to count exactly', () => {
    expect(parseAmount('99999999 tỷ')).toBeNull();
  });

  it('never reads a first group of 0 as thousands', () => {
    expect(parseAmount('0.500tr')).toBe(500_000);
  });
});
describe('parseAmount outside đồng', () => {
  const usd = currencyOf('USD');
  const eur = currencyOf('EUR');
  const jpy = currencyOf('JPY');

  it('takes a bare number as written, in minor units', () => {
    expect(parseAmount('35', usd)).toBe(3_500);
    expect(parseAmount('$3.50', usd)).toBe(350);
    expect(parseAmount('1,250', usd)).toBe(125_000);
    expect(parseAmount('1,250.75 USD', usd)).toBe(125_075);
    expect(parseAmount('12,50 €', eur)).toBe(1_250);
    expect(parseAmount('¥1200', jpy)).toBe(1_200);
  });

  it('reads k and m as thousands and millions', () => {
    expect(parseAmount('45k', usd)).toBe(4_500_000);
    expect(parseAmount('1.5k', usd)).toBe(150_000);
    expect(parseAmount('2 million', usd)).toBe(200_000_000);
    expect(parseAmount('1m2', usd)).toBe(120_000_000);
  });

  it('finds the amount in a question', () => {
    expect(parseAmount('can I afford 120 on saturday?', usd)).toBe(12_000);
    expect(parseAmount('nothing here', usd)).toBeNull();
  });

  it('never reads a first group of 0 as thousands', () => {
    expect(parseAmount('0.250', usd)).toBe(25);
    expect(parseAmount('$0.500', usd)).toBe(50);
  });

  it('reads one lone .ddd as thousandths in a dinar', () => {
    expect(parseAmount('1.250', currencyOf('KWD'))).toBe(1_250);
    expect(parseAmount('KD 12.500', currencyOf('KWD'))).toBe(12_500);
    expect(parseAmount('1.250.000', currencyOf('KWD'))).toBe(1_250_000_000);
  });

  it('keeps a symbol of letters from eating the units', () => {
    expect(parseAmount('Rp 25.000', currencyOf('IDR'))).toBe(25_000);
    expect(parseAmount('R45k', currencyOf('ZAR'))).toBe(4_500_000);
    expect(parseAmount('120 kr', currencyOf('SEK'))).toBe(12_000);
  });
});
