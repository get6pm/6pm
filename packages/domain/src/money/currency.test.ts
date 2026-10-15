import { describe, expect, it } from 'vitest';

import {
  ceilToSetAside,
  currencyOf,
  designAmount,
  floorToStep,
  roundToStep,
  steps,
  toMajor,
  toMinor,
  VND,
} from './currency';

describe('currencyOf', () => {
  it('keeps đồng as the design has it: no minor unit, a step of 1.000₫', () => {
    expect(VND).toMatchObject({ code: 'VND', minorDigits: 0, minorPerMajor: 1, step: 1000 });
    expect(currencyOf('vnd')).toBe(VND);
  });

  it('counts dollars in cents with a one-dollar step', () => {
    expect(currencyOf('USD')).toMatchObject({ minorDigits: 2, minorPerMajor: 100, step: 100 });
    expect(currencyOf('EUR').symbol).toBe('€');
  });

  it('scales the step to what a currency is worth, never below one unit', () => {
    expect(currencyOf('JPY').step).toBe(10);
    expect(currencyOf('KRW').step).toBe(100);
    expect(currencyOf('IDR').step).toBe(1000);
    expect(currencyOf('INR').step).toBe(1000);
    expect(currencyOf('THB').step).toBe(100);
    expect(currencyOf('KWD')).toMatchObject({ minorPerMajor: 1000, step: 1000 });
  });

  it('writes every symbol left to right, so it never reorders the sentence around it', () => {
    for (const code of ['IRR', 'AED', 'SAR', 'EGP', 'ILS']) {
      expect(currencyOf(code).symbol).not.toMatch(/[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/u);
    }
  });

  it('still works for a code it has no row for', () => {
    expect(currencyOf('xyz')).toMatchObject({
      code: 'XYZ',
      symbol: 'XYZ',
      minorDigits: 2,
      step: 100,
    });
  });
});

describe('minor units', () => {
  it('converts between major and minor amounts', () => {
    const usd = currencyOf('USD');
    expect(toMinor(3.5, usd)).toBe(350);
    expect(toMinor(0.1 + 0.2, usd)).toBe(30);
    expect(toMajor(350, usd)).toBe(3.5);
    expect(toMinor(45_000, VND)).toBe(45_000);
  });
});

describe('rounding by step', () => {
  const usd = currencyOf('USD');

  it('floors daily lines to a whole step', () => {
    expect(floorToStep(353_999, VND)).toBe(353_000);
    expect(floorToStep(4_399, usd)).toBe(4_300);
    expect(floorToStep(-1_250, usd)).toBe(-1_300);
  });

  it('rounds to the nearest step', () => {
    expect(roundToStep(5_499, VND)).toBe(5_000);
    expect(roundToStep(450, usd)).toBe(500);
  });

  it('ceils set-asides to fifty steps', () => {
    expect(ceilToSetAside(120_001, VND)).toBe(150_000);
    expect(ceilToSetAside(4_200, usd)).toBe(5_000);
    expect(ceilToSetAside(5_000, usd)).toBe(5_000);
  });

  it('counts in steps as the design counts in thousands', () => {
    expect(steps(5, VND)).toBe(5_000);
    expect(steps(5, usd)).toBe(500);
    expect(steps(50, currencyOf('JPY'))).toBe(500);
  });
});

describe('designAmount', () => {
  it('returns đồng as it is', () => {
    expect(designAmount(600_000, VND)).toBe(600_000);
  });

  it('scales a design amount by value and snaps it to a round number', () => {
    const usd = currencyOf('USD');
    expect(designAmount(600_000, usd)).toBe(2_500);
    expect(designAmount(500_000, usd)).toBe(2_000);
    expect(designAmount(1_000_000, usd)).toBe(4_000);
    expect(designAmount(15_500_000, usd)).toBe(60_000);
    expect(designAmount(500_000, currencyOf('JPY'))).toBe(3_000);
  });

  it('is never below one step', () => {
    expect(designAmount(1_000, currencyOf('USD'))).toBe(100);
    expect(designAmount(0, currencyOf('USD'))).toBe(0);
  });
});
