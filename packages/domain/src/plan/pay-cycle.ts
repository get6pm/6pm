import {
  addDays,
  daysInMonth,
  diffDays,
  makeDate,
  parts,
  type LocalDate,
} from '../time/local-date';

/**
 * When money lands. `sameDay` clamps to short months (the 31st is the 30th in November); `varies`
 * is treated as the last day of the month until the user tells 6pm the money has arrived.
 */
export type Payday =
  | { readonly kind: 'sameDay'; readonly day: number }
  | { readonly kind: 'lastDay' }
  | { readonly kind: 'varies' };

function paydayIn(year: number, month: number, payday: Payday): LocalDate {
  const last = daysInMonth(year, month);
  switch (payday.kind) {
    case 'sameDay':
      return makeDate(year, month, Math.min(Math.max(1, payday.day), last));
    case 'lastDay':
    case 'varies':
      return makeDate(year, month, last);
  }
}

function shiftMonth(year: number, month: number, by: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + by;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export interface PayCycle {
  /** The payday this cycle started on (money arrived that day). */
  readonly start: LocalDate;
  /** The next payday: the last day this cycle's money has to cover. */
  readonly payday: LocalDate;
  /** Days after `today` through `payday`: the divisor for tomorrow's number. */
  readonly daysLeft: number;
}

/**
 * The pay cycle `today` sits in. On payday itself a new cycle starts. The design counts the payday
 * as a day the money still covers (Fri 9 Oct with payday 31 Oct leaves 22 days).
 */
export function payCycleOn(today: LocalDate, payday: Payday): PayCycle {
  const { year, month } = parts(today);
  const thisMonth = paydayIn(year, month, payday);
  const startMonth = today >= thisMonth ? { year, month } : shiftMonth(year, month, -1);
  const start = paydayIn(startMonth.year, startMonth.month, payday);
  const after = shiftMonth(startMonth.year, startMonth.month, 1);
  let next = paydayIn(after.year, after.month, payday);
  // A cycle is never shorter than a day, even when a clamped payday lands on the same date.
  if (next <= today) next = addDays(today, 1);
  return { start, payday: next, daysLeft: diffDays(next, today) };
}
