import type { Vnd } from '../money/format';

/**
 * Typing a pot's goal: digits, a decimal comma and a unit, so "1,5" with "tỷ" is 1.500.000.000₫
 * and "250" with "nghìn" is 250.000₫. The unit is a separate choice, so changing it keeps the
 * digits ("2" from triệu to tỷ is 2 tỷ). Goals run from tens of thousands to a hundred billion.
 */
export type GoalUnit = 'dong' | 'thousand' | 'million' | 'billion';

export const GOAL_UNITS: readonly GoalUnit[] = ['dong', 'thousand', 'million', 'billion'];

const UNIT_VALUE: Readonly<Record<GoalUnit, number>> = {
  dong: 1,
  thousand: 1_000,
  million: 1_000_000,
  billion: 1_000_000_000,
};

/** Decimals a unit takes: as many as keep the amount in whole đồng, and never more than three. */
const UNIT_DECIMALS: Readonly<Record<GoalUnit, number>> = {
  dong: 0,
  thousand: 3,
  million: 3,
  billion: 3,
};

/** The largest goal a pot takes: a hundred billion đồng. */
export const POT_GOAL_MAX: Vnd = 100_000_000_000;

/** The smallest goal a pot can start with. */
export const POT_GOAL_MIN: Vnd = 10_000;

export interface GoalEntry {
  /** What was typed: digits with at most one '.', the decimal point. */
  readonly digits: string;
  readonly unit: GoalUnit;
}

export type GoalKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'back';

/** The amount an entry stands for, in whole đồng, worked out in integers. */
export function goalEntryValue(entry: GoalEntry): Vnd {
  const [whole = '', fraction = ''] = entry.digits.split('.');
  const decimals = UNIT_DECIMALS[entry.unit];
  const unit = UNIT_VALUE[entry.unit];
  const cents = fraction.slice(0, decimals).padEnd(decimals, '0');
  const fractionValue = decimals === 0 ? 0 : (Number(cents) * unit) / 10 ** decimals;
  return Number(whole || '0') * unit + fractionValue;
}

/** The digits that show an amount exactly in a unit, or null when it needs more decimals. */
function digitsIn(amount: Vnd, unit: GoalUnit): string | null {
  const value = UNIT_VALUE[unit];
  const decimals = UNIT_DECIMALS[unit];
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
 * An amount as the keypad would have typed it, in the largest unit that holds it whole or with up
 * to three decimals: 2.000.000.000 is "2" tỷ, 1.250.000 is "1.25" triệu, 750.000 is "750" nghìn.
 */
export function goalEntryOf(amount: Vnd): GoalEntry {
  const whole = Math.max(0, Math.round(amount));
  if (whole === 0) return { digits: '', unit: 'million' };
  const units: readonly GoalUnit[] = ['billion', 'million', 'thousand'];
  for (const unit of units) {
    if (whole < UNIT_VALUE[unit]) continue;
    const digits = digitsIn(whole, unit);
    if (digits !== null) return { digits, unit };
  }
  return { digits: String(whole), unit: 'dong' };
}

/** Whether an entry stays inside what a pot can hold. */
function fits(entry: GoalEntry): boolean {
  return goalEntryValue(entry) <= POT_GOAL_MAX;
}

/**
 * One key on the goal keypad. A leading zero gives way to the next digit, the decimal point comes
 * once (and only for a unit that takes decimals), and a key that would pass the largest goal or
 * the unit's decimals does nothing. `replace` starts over, as the first key after opening does.
 */
export function pressGoalKey(entry: GoalEntry, key: GoalKey, replace = false): GoalEntry {
  const from = replace && key !== 'back' ? { ...entry, digits: '' } : entry;
  const { digits } = from;
  if (key === 'back') return { ...from, digits: digits.slice(0, -1) };
  let next: string;
  if (key === '.') {
    if (UNIT_DECIMALS[from.unit] === 0 || digits.includes('.')) return entry;
    next = (digits === '' ? '0' : digits) + '.';
  } else {
    const fraction = digits.split('.')[1];
    if (fraction !== undefined && fraction.length >= UNIT_DECIMALS[from.unit]) return entry;
    next = digits === '0' ? key : digits + key;
  }
  const out = { ...from, digits: next };
  return fits(out) ? out : entry;
}

/** Whether the digits typed so far can take a unit without passing the largest goal. */
export function goalUnitFits(entry: GoalEntry, unit: GoalUnit): boolean {
  return fits(withUnit(entry, unit));
}

function withUnit(entry: GoalEntry, unit: GoalUnit): GoalEntry {
  const [whole = '', fraction] = entry.digits.split('.');
  const decimals = UNIT_DECIMALS[unit];
  if (fraction === undefined) return { digits: whole, unit };
  if (decimals === 0) return { digits: whole, unit };
  return { digits: `${whole}.${fraction.slice(0, decimals)}`, unit };
}

/** The same digits in another unit; unchanged when that would pass the largest goal. */
export function setGoalUnit(entry: GoalEntry, unit: GoalUnit): GoalEntry {
  const next = withUnit(entry, unit);
  return fits(next) ? next : entry;
}
