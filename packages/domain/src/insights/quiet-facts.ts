import type { ClosedDayTotal } from '../diary/calendar';
import { dayDot } from '../diary/calendar';
import { addDays, diffDays } from '../time/local-date';
import { countSlot, dateSlot, moneySlot, type Fact, type InsightInput } from './fact';

/** Days without a single spend logged, today included, before the log looks forgotten. */
const LOG_GAP_DAYS = 3;

/** The closed day the companion looks back on: today once it is closed, else yesterday. */
function lastClosed(input: InsightInput): ClosedDayTotal | undefined {
  const byDay = new Map(input.closed.map((d) => [d.day, d]));
  return byDay.get(input.today) ?? byDay.get(addDays(input.today, -1));
}

/** Days that logged nothing at all, kept or not. */
function loggedDays(input: InsightInput): Set<string> {
  return new Set(input.spends.filter((s) => s.status !== 'deleted').map((s) => s.day));
}

/**
 * Closed days in a row that cost nothing, back from the last closed day: one is a no-spend day,
 * two or more a streak. `kept` is the lines those days left untouched.
 */
export function noSpendFacts(input: InsightInput): Fact[] {
  const last = lastClosed(input);
  if (last === undefined) return [];
  const byDay = new Map(input.closed.map((d) => [d.day, d]));
  const logged = loggedDays(input);
  let days = 0;
  let kept = 0;
  for (
    let row = byDay.get(last.day);
    row !== undefined && row.spent === 0 && !logged.has(row.day);
    row = byDay.get(addDays(last.day, -days))
  ) {
    days += 1;
    kept += row.line;
  }
  if (days === 0 || kept <= 0) return [];
  if (days === 1) {
    return [
      {
        kind: 'noSpendDay',
        key: `noSpendDay:${last.day}`,
        tone: 'good',
        salience: 0.5,
        repeatAfterDays: 1,
        slots: { kept: moneySlot(kept) },
      },
    ];
  }
  return [
    {
      kind: 'noSpendStreak',
      key: `noSpendStreak:${last.day}:${String(days)}`,
      tone: 'good',
      salience: Math.min(0.7, 0.5 + 0.05 * days),
      repeatAfterDays: 1,
      slots: { days: countSlot(days), kept: moneySlot(kept) },
    },
  ];
}

/** The last closed day came back under its line right after a day over. */
export function backUnderFacts(input: InsightInput): Fact[] {
  const last = lastClosed(input);
  if (last === undefined || dayDot(last.spent, last.line) !== 'under') return [];
  const before = input.closed.find((d) => d.day === addDays(last.day, -1));
  if (before === undefined || dayDot(before.spent, before.line) !== 'over') return [];
  return [
    {
      kind: 'backUnder',
      key: `backUnder:${last.day}`,
      tone: 'good',
      salience: 0.55,
      repeatAfterDays: 1,
      slots: { spare: moneySlot(last.line - last.spent) },
    },
  ];
}

/**
 * Nothing logged for days, after spends were logged before: more likely a forgotten log than a
 * quiet wallet, so the companion asks instead of praising (see `collectFacts`).
 */
export function logGapFacts(input: InsightInput): Fact[] {
  const logged = [...loggedDays(input)].filter((d) => d <= input.today).sort();
  const last = logged.at(-1);
  if (last === undefined) return [];
  const gap = diffDays(input.today, last);
  if (gap < LOG_GAP_DAYS) return [];
  return [
    {
      kind: 'logGap',
      key: `logGap:${last}`,
      tone: 'neutral',
      salience: 0.65,
      repeatAfterDays: 2,
      slots: { days: countSlot(gap - 1), since: dateSlot(last) },
    },
  ];
}
