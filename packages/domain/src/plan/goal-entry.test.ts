import { describe, expect, it } from 'vitest';

import { currencyOf, VND } from '../money/currency';
import {
  GOAL_UNITS,
  goalEntryOf,
  goalEntryValue,
  goalUnitFits,
  goalUnitsFor,
  goalUnitTakesDecimals,
  POT_GOAL_MAX,
  potGoalMax,
  potGoalMin,
  pressGoalKey,
  setGoalUnit,
  type GoalEntry,
  type GoalKey,
} from './goal-entry';

const type = (entry: GoalEntry, keys: string): GoalEntry =>
  [...keys].reduce((e, k) => pressGoalKey(e, (k === '<' ? 'back' : k) as GoalKey), entry);

const blank = (unit: GoalEntry['unit']): GoalEntry => ({ digits: '', unit });

describe('goalEntryValue', () => {
  it('reads digits in their unit, in whole đồng', () => {
    expect(goalEntryValue({ digits: '2', unit: 'billion' })).toBe(2_000_000_000);
    expect(goalEntryValue({ digits: '1.5', unit: 'billion' })).toBe(1_500_000_000);
    expect(goalEntryValue({ digits: '1.25', unit: 'million' })).toBe(1_250_000);
    expect(goalEntryValue({ digits: '250', unit: 'thousand' })).toBe(250_000);
    expect(goalEntryValue({ digits: '45000', unit: 'whole' })).toBe(45_000);
    expect(goalEntryValue({ digits: '', unit: 'million' })).toBe(0);
    expect(goalEntryValue({ digits: '3.', unit: 'million' })).toBe(3_000_000);
  });

  it('keeps fractions exact, with no floating point drift', () => {
    expect(goalEntryValue({ digits: '0.001', unit: 'billion' })).toBe(1_000_000);
    expect(goalEntryValue({ digits: '2.345', unit: 'billion' })).toBe(2_345_000_000);
    expect(goalEntryValue({ digits: '0.3', unit: 'million' })).toBe(300_000);
  });
});

describe('goalEntryOf', () => {
  it('picks the largest unit that holds the amount', () => {
    expect(goalEntryOf(2_000_000_000)).toEqual({ digits: '2', unit: 'billion' });
    expect(goalEntryOf(1_500_000_000)).toEqual({ digits: '1.5', unit: 'billion' });
    expect(goalEntryOf(800_000_000)).toEqual({ digits: '800', unit: 'million' });
    expect(goalEntryOf(1_250_000)).toEqual({ digits: '1.25', unit: 'million' });
    expect(goalEntryOf(750_000)).toEqual({ digits: '750', unit: 'thousand' });
    expect(goalEntryOf(500)).toEqual({ digits: '500', unit: 'whole' });
  });

  it('falls to a smaller unit when the larger needs more than three decimals', () => {
    expect(goalEntryOf(1_234_567)).toEqual({ digits: '1234.567', unit: 'thousand' });
    expect(goalEntryOf(2_000_500_000)).toEqual({ digits: '2000.5', unit: 'million' });
  });

  it('round-trips every amount it shows', () => {
    for (const amount of [10_000, 999_000, 2_500_000, 1_234_567, 3_450_000_000, POT_GOAL_MAX]) {
      expect(goalEntryValue(goalEntryOf(amount))).toBe(amount);
    }
  });

  it('starts an empty goal in millions', () => {
    expect(goalEntryOf(0)).toEqual({ digits: '', unit: 'million' });
  });
});

describe('pressGoalKey', () => {
  it('types digits, a decimal point and deletes', () => {
    expect(type(blank('billion'), '1.5')).toEqual({ digits: '1.5', unit: 'billion' });
    expect(type(blank('million'), '25<0')).toEqual({ digits: '20', unit: 'million' });
    expect(type(blank('million'), '.5')).toEqual({ digits: '0.5', unit: 'million' });
  });

  it('lets a leading zero give way and takes the point only once', () => {
    expect(type(blank('million'), '07')).toEqual({ digits: '7', unit: 'million' });
    expect(type(blank('million'), '1..2')).toEqual({ digits: '1.2', unit: 'million' });
  });

  it('takes no point in đồng and at most three decimals elsewhere', () => {
    expect(type(blank('whole'), '5.0')).toEqual({ digits: '50', unit: 'whole' });
    expect(type(blank('billion'), '1.2345')).toEqual({ digits: '1.234', unit: 'billion' });
  });

  it('never passes the largest goal', () => {
    expect(goalEntryValue(type(blank('billion'), '1000'))).toBe(100_000_000_000);
    expect(type(blank('billion'), '1001')).toEqual({ digits: '100', unit: 'billion' });
  });

  it('starts over on the first key after opening, except for delete', () => {
    const open = goalEntryOf(2_000_000);
    expect(pressGoalKey(open, '5', true)).toEqual({ digits: '5', unit: 'million' });
    expect(pressGoalKey(open, '.', true)).toEqual({ digits: '0.', unit: 'million' });
    expect(pressGoalKey(open, 'back', true)).toEqual({ digits: '', unit: 'million' });
  });
});

describe('setGoalUnit', () => {
  it('keeps the digits and changes the scale', () => {
    expect(setGoalUnit({ digits: '2', unit: 'million' }, 'billion')).toEqual({
      digits: '2',
      unit: 'billion',
    });
    expect(goalEntryValue(setGoalUnit({ digits: '500', unit: 'million' }, 'thousand'))).toBe(
      500_000,
    );
  });

  it('drops decimals a unit cannot take', () => {
    expect(setGoalUnit({ digits: '1.5', unit: 'million' }, 'whole')).toEqual({
      digits: '1',
      unit: 'whole',
    });
  });

  it('refuses a unit that would pass the largest goal', () => {
    const entry = { digits: '500', unit: 'million' } as const;
    expect(goalUnitFits(entry, 'billion')).toBe(false);
    expect(setGoalUnit(entry, 'billion')).toBe(entry);
    expect(goalUnitFits(entry, 'thousand')).toBe(true);
  });
});

describe('in đồng', () => {
  it('keeps the four units and the bounds the design has', () => {
    expect(GOAL_UNITS).toEqual(['whole', 'thousand', 'million', 'billion']);
    expect(goalUnitsFor(VND)).toEqual(GOAL_UNITS);
    expect(potGoalMax(VND)).toBe(100_000_000_000);
    expect(potGoalMin(VND)).toBe(10_000);
    expect(goalUnitTakesDecimals('whole', VND)).toBe(false);
  });
});

describe('in dollars', () => {
  const usd = currencyOf('USD');
  const typeUsd = (entry: GoalEntry, keys: string): GoalEntry =>
    [...keys].reduce((e, k) => pressGoalKey(e, k as GoalKey, false, usd), entry);

  it('counts in cents, with dollars, thousands and millions to type in', () => {
    expect(goalUnitsFor(usd)).toEqual(['whole', 'thousand', 'million']);
    expect(potGoalMax(usd)).toBe(400_000_000);
    expect(potGoalMin(usd)).toBe(100);
    expect(goalEntryValue({ digits: '12.5', unit: 'whole' }, usd)).toBe(1_250);
    expect(goalEntryValue({ digits: '1.25', unit: 'thousand' }, usd)).toBe(125_000);
    expect(goalEntryValue({ digits: '2', unit: 'million' }, usd)).toBe(200_000_000);
  });

  it('takes cents on the dollar, and three decimals on thousands', () => {
    expect(goalUnitTakesDecimals('whole', usd)).toBe(true);
    expect(typeUsd(blank('whole'), '9.999')).toEqual({ digits: '9.99', unit: 'whole' });
    expect(typeUsd(blank('thousand'), '1.2345')).toEqual({ digits: '1.234', unit: 'thousand' });
  });

  it('shows an amount in the largest unit that holds it, and round-trips', () => {
    expect(goalEntryOf(150_000, usd)).toEqual({ digits: '1.5', unit: 'thousand' });
    expect(goalEntryOf(250_000_000, usd)).toEqual({ digits: '2.5', unit: 'million' });
    expect(goalEntryOf(12_345, usd)).toEqual({ digits: '123.45', unit: 'whole' });
    expect(goalEntryOf(0, usd)).toEqual({ digits: '', unit: 'whole' });
    for (const amount of [100, 12_345, 123_456, 40_000_000, 400_000_000]) {
      expect(goalEntryValue(goalEntryOf(amount, usd), usd)).toBe(amount);
    }
  });

  it('never passes four million dollars', () => {
    expect(typeUsd(blank('million'), '45')).toEqual({ digits: '4', unit: 'million' });
    expect(goalUnitFits({ digits: '5000', unit: 'whole' }, 'million', usd)).toBe(false);
    expect(setGoalUnit({ digits: '3', unit: 'thousand' }, 'million', usd)).toEqual({
      digits: '3',
      unit: 'million',
    });
  });
});
