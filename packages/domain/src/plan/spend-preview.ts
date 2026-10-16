import type { Money as Vnd } from '../money/currency';
import type { DailyNumber } from './daily-number';

/** Today's meter with a spend still being thought about added to it. */
export interface SpendPreview {
  /** What is left of today's line after it. */
  readonly left: Vnd;
  /** Spent already, as a share of today's line (0–1). */
  readonly spentShare: number;
  /** The spend, as a share of today's line. */
  readonly addShare: number;
}

/**
 * What a spend Ask was asked about would do to today: what is left of the line after it, and the
 * meter's two parts, spent and the spend, each a share of the line. Only for a spend that fits in
 * what is still safe today, which is when Ask answers about today; a bigger one is answered for
 * the days after, and has no today to show.
 */
export function spendPreview(day: DailyNumber, amount: Vnd): SpendPreview | null {
  if (amount > Math.max(0, day.safe) || day.line <= 0) return null;
  const spentShare = Math.min(1, Math.max(0, day.spent / day.line));
  const addShare = Math.min(1 - spentShare, Math.max(0, amount / day.line));
  return { left: day.safe - amount, spentShare, addShare };
}
