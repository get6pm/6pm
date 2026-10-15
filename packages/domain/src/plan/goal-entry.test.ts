import { describe, expect, it } from 'vitest';

import {
  goalEntryOf,
  goalEntryValue,
  goalUnitFits,
  POT_GOAL_MAX,
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
    expect(goalEntryValue({ digits: '45000', unit: 'dong' })).toBe(45_000);
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
    expect(goalEntryOf(500)).toEqual({ digits: '500', unit: 'dong' });
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
    expect(type(blank('dong'), '5.0')).toEqual({ digits: '50', unit: 'dong' });
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
    expect(setGoalUnit({ digits: '1.5', unit: 'million' }, 'dong')).toEqual({
      digits: '1',
      unit: 'dong',
    });
  });

  it('refuses a unit that would pass the largest goal', () => {
    const entry = { digits: '500', unit: 'million' } as const;
    expect(goalUnitFits(entry, 'billion')).toBe(false);
    expect(setGoalUnit(entry, 'billion')).toBe(entry);
    expect(goalUnitFits(entry, 'thousand')).toBe(true);
  });
});
