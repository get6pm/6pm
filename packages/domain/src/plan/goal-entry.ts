import { designAmount, VND, type Currency, type Money } from '../money/currency';

/**
 * Typing a pot's goal: digits, a decimal point and a unit, so "1,5" with "tỷ" is 1.500.000.000₫
 * and "250" with "nghìn" is 250.000₫. The unit is a separate choice, so changing it keeps the
 * digits ("2" from triệu to tỷ is 2 tỷ). The first unit is the currency's own (đồng, a dollar),
 * then thousands, millions and billions of it. Amounts are in the currency's minor units.
 */
export type GoalUnit = 'whole' | 'thousand' | 'million' | 'billion';

const ALL_UNITS: readonly GoalUnit[] = ['whole', 'thousand', 'million', 'billion'];

/** Whole units each unit stands for. */
const UNIT_WHOLE: Readonly<Record<GoalUnit, number>> = {
  whole: 1,
  thousand: 1_000,
  million: 1_000_000,
  billion: 1_000_000_000,
};

/** The largest goal a pot takes in đồng: a hundred billion. */
export const POT_GOAL_MAX: Money = 100_000_000_000;

/** The smallest goal a pot can start with in đồng. */
export const POT_GOAL_MIN: Money = 10_000;

/** The largest goal a pot takes: a hundred billion đồng, worth the same in the home currency. */
export function potGoalMax(currency: Currency = VND): Money {
  return designAmount(POT_GOAL_MAX, currency);
}

/** The smallest goal a pot can start with: 10.000₫ worth in the home currency. */
export function potGoalMin(currency: Currency = VND): Money {
  return designAmount(POT_GOAL_MIN, currency);
}

/** A unit's size in minor units. */
function unitValue(unit: GoalUnit, currency: Currency): number {
  return UNIT_WHOLE[unit] * currency.minorPerMajor;
}

/**
 * Decimals a unit takes: as many as keep the amount in whole minor units, and never more than
 * three. Đồng takes none, a dollar two, a thousand of anything three.
 */
function unitDecimals(unit: GoalUnit, currency: Currency): number {
  return Math.min(3, Math.round(Math.log10(unitValue(unit, currency))));
}

/** The units a goal can be typed in: those no bigger than the largest goal (all four in đồng). */
export function goalUnitsFor(currency: Currency = VND): readonly GoalUnit[] {
  const max = potGoalMax(currency);
  return ALL_UNITS.filter((unit) => unitValue(unit, currency) <= max);
}

/** Every unit in đồng. */
export const GOAL_UNITS: readonly GoalUnit[] = goalUnitsFor(VND);

export interface GoalEntry {
  /** What was typed: digits with at most one '.', the decimal point. */
  readonly digits: string;
  readonly unit: GoalUnit;
}

export type GoalKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'back';

/** The amount an entry stands for, in minor units, worked out in integers. */
export function goalEntryValue(entry: GoalEntry, currency: Currency = VND): Money {
  const [whole = '', fraction = ''] = entry.digits.split('.');
  const decimals = unitDecimals(entry.unit, currency);
  const unit = unitValue(entry.unit, currency);
  const cents = fraction.slice(0, decimals).padEnd(decimals, '0');
  const fractionValue = decimals === 0 ? 0 : (Number(cents) * unit) / 10 ** decimals;
  return Number(whole || '0') * unit + fractionValue;
}

/** The digits that show an amount exactly in a unit, or null when it needs more decimals. */
function digitsIn(amount: Money, unit: GoalUnit, currency: Currency): string | null {
  const value = unitValue(unit, currency);
  const decimals = unitDecimals(unit, currency);
  const step = value / 10 ** decimals;
  if (amount % step !== 0) return null;
  const whole = Math.floor(amount / value);
  const rest = amount - whole * value;
  if (rest === 0) return String(whole);
  const fraction = String(rest / step)
    .padStart(decimals, '0')
    .replace(/0+$/, '');
  return `${whole}.${fraction}`;
}

/**
 * The unit an empty goal starts in: the largest no bigger than the design's 1 triệu in the
 * currency (triệu in đồng, the dollar itself in the US).
 */
function emptyUnit(currency: Currency): GoalUnit {
  const around = designAmount(1_000_000, currency);
  const units = goalUnitsFor(currency);
  return units.reduce((best, unit) => (unitValue(unit, currency) <= around ? unit : best), 'whole');
}

/**
 * An amount as the keypad would have typed it, in the largest unit that holds it whole or with up
 * to three decimals: 2.000.000.000 is "2" tỷ, 1.250.000 is "1.25" triệu, 750.000 is "750" nghìn.
 */
export function goalEntryOf(amount: Money, currency: Currency = VND): GoalEntry {
  const whole = Math.max(0, Math.round(amount));
  if (whole === 0) return { digits: '', unit: emptyUnit(currency) };
  const units = [...goalUnitsFor(currency)].reverse().filter((u) => u !== 'whole');
  for (const unit of units) {
    if (whole < unitValue(unit, currency)) continue;
    const digits = digitsIn(whole, unit, currency);
    if (digits !== null) return { digits, unit };
  }
  return { digits: digitsIn(whole, 'whole', currency) ?? String(whole), unit: 'whole' };
}

/** Whether an entry stays inside what a pot can hold. */
function fits(entry: GoalEntry, currency: Currency): boolean {
  return goalEntryValue(entry, currency) <= potGoalMax(currency);
}

/**
 * One key on the goal keypad. A leading zero gives way to the next digit, the decimal point comes
 * once (and only for a unit that takes decimals), and a key that would pass the largest goal or
 * the unit's decimals does nothing. `replace` starts over, as the first key after opening does.
 */
export function pressGoalKey(
  entry: GoalEntry,
  key: GoalKey,
  replace = false,
  currency: Currency = VND,
): GoalEntry {
  const from = replace && key !== 'back' ? { ...entry, digits: '' } : entry;
  const { digits } = from;
  if (key === 'back') return { ...from, digits: digits.slice(0, -1) };
  const decimals = unitDecimals(from.unit, currency);
  let next: string;
  if (key === '.') {
    if (decimals === 0 || digits.includes('.')) return entry;
    next = (digits === '' ? '0' : digits) + '.';
  } else {
    const fraction = digits.split('.')[1];
    if (fraction !== undefined && fraction.length >= decimals) return entry;
    next = digits === '0' ? key : digits + key;
  }
  const out = { ...from, digits: next };
  return fits(out, currency) ? out : entry;
}

/** Whether a unit takes a decimal point (đồng and yen do not). */
export function goalUnitTakesDecimals(unit: GoalUnit, currency: Currency = VND): boolean {
  return unitDecimals(unit, currency) > 0;
}

/** Whether the digits typed so far can take a unit without passing the largest goal. */
export function goalUnitFits(entry: GoalEntry, unit: GoalUnit, currency: Currency = VND): boolean {
  return fits(withUnit(entry, unit, currency), currency);
}

function withUnit(entry: GoalEntry, unit: GoalUnit, currency: Currency): GoalEntry {
  const [whole = '', fraction] = entry.digits.split('.');
  const decimals = unitDecimals(unit, currency);
  if (fraction === undefined) return { digits: whole, unit };
  if (decimals === 0) return { digits: whole, unit };
  return { digits: `${whole}.${fraction.slice(0, decimals)}`, unit };
}

/** The same digits in another unit; unchanged when that would pass the largest goal. */
export function setGoalUnit(entry: GoalEntry, unit: GoalUnit, currency: Currency = VND): GoalEntry {
  const next = withUnit(entry, unit, currency);
  return fits(next, currency) ? next : entry;
}
