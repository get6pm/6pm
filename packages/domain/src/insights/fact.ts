import type { Currency } from '../money/currency';
import type { Vnd } from '../money/format';
import type { DailyNumber } from '../plan/daily-number';
import type { PayCycle } from '../plan/pay-cycle';
import type { DiarySpend } from '../diary/week-recap';
import type { ClosedDayTotal } from '../diary/calendar';
import { countsTowardDay, type SpendSource } from '../spend/spend';
import type { LocalDate } from '../time/local-date';

/**
 * How a value compares with the one before it, worked out in code so neither a model nor the
 * catalogue ever compares two numbers. `about` facts are never told.
 */
export type Comparison = 'muchMore' | 'more' | 'about' | 'less' | 'muchLess';

/** One value a line may show. Money and dates are formatted by the phone, in the user's language. */
export type FactSlot =
  | { readonly type: 'money'; readonly value: Vnd }
  | { readonly type: 'count'; readonly value: number }
  | { readonly type: 'date'; readonly value: LocalDate }
  | { readonly type: 'merchant'; readonly value: string }
  | { readonly type: 'category'; readonly id: string }
  | { readonly type: 'pot'; readonly id: string; readonly name: string }
  | { readonly type: 'bill'; readonly id: string; readonly name: string }
  | { readonly type: 'compare'; readonly value: Comparison };

/** The slots each kind of fact carries, by name: the placeholders its lines may use. */
export const FACT_SLOTS = {
  todayOver: ['over', 'tomorrow'],
  todayUnder: ['safe', 'spent'],
  noSpendYet: ['line'],
  waitingTonight: ['count', 'amount'],
  paydaySoon: ['days', 'payday'],
  billDue: ['bill', 'amount', 'days'],
  categoryPace: ['category', 'now', 'before', 'compare'],
  repeatMerchant: ['merchant', 'visits', 'amount'],
  firstTimeMerchant: ['merchant', 'amount'],
  biggestSpend: ['merchant', 'amount', 'category'],
  underStreak: ['days'],
  closeStreak: ['days'],
  weekSpare: ['days', 'spare'],
  weekOver: ['over'],
  potMilestone: ['pot', 'percent'],
  potFull: ['pot'],
  workToClaim: ['count', 'amount'],
} as const satisfies Record<string, readonly string[]>;

export type FactKind = keyof typeof FACT_SLOTS;
export const FACT_KINDS = Object.keys(FACT_SLOTS) as FactKind[];

/** good: worth cheering; neutral: worth knowing; watch: worth a gentle look, never a scolding. */
export type FactTone = 'good' | 'neutral' | 'watch';

/**
 * Something true about the user's own days, computed from their data. The companion says at most
 * one per moment; `key` names the fact so it is not said again within `repeatAfterDays`.
 */
export interface FactOf<K extends FactKind> {
  readonly kind: K;
  readonly key: string;
  readonly tone: FactTone;
  /** How much it is worth saying now, 0–1. */
  readonly salience: number;
  readonly repeatAfterDays: number;
  readonly slots: { readonly [S in (typeof FACT_SLOTS)[K][number]]: FactSlot };
  /** Categories the fact is about beyond its slots, such as the spends at a merchant it names. */
  readonly about?: readonly string[];
}

export type Fact = { [K in FactKind]: FactOf<K> }[FactKind];

/** A fact's slots by name, for code that reads any kind. */
export function slotsOf(fact: Fact): Readonly<Record<string, FactSlot | undefined>> {
  return fact.slots;
}

/** A spend as the facts read it: the Diary's fields plus when and how it was caught. */
export interface InsightSpend extends DiarySpend {
  readonly id: string;
  readonly source: SpendSource;
}

export interface InsightBill {
  readonly id: string;
  readonly name: string;
  readonly amount: Vnd;
  /** Day of the month it falls due, 1–31 (clamped to short months). */
  readonly dueDay: number;
  /** Already paid in this pay cycle. */
  readonly paid: boolean;
}

export interface InsightPot {
  readonly id: string;
  readonly name: string;
  readonly goal: Vnd;
  readonly saved: Vnd;
}

/** Everything the facts read. The phone builds it from its store; nothing here leaves the phone. */
export interface InsightInput {
  /** The money day (see `filingDay`). */
  readonly today: LocalDate;
  readonly day: DailyNumber;
  readonly cycle: PayCycle;
  /** Where the cycle before this one started, when there was one; patterns compare against it. */
  readonly previousCycleStart: LocalDate | null;
  /** Spends from `previousCycleStart` (or this cycle's start) through today, any status. */
  readonly spends: readonly InsightSpend[];
  /** Closed days over the same span. */
  readonly closed: readonly ClosedDayTotal[];
  readonly notDaily: ReadonlySet<string>;
  readonly bills: readonly InsightBill[];
  readonly pots: readonly InsightPot[];
  /** The home currency, for what counts as worth a word; đồng when not given. */
  readonly currency?: Currency;
}

/** Spends counted toward the daily number, from `from` through `to`. */
export function countedSpends(input: InsightInput, from: LocalDate, to: LocalDate): InsightSpend[] {
  return input.spends.filter(
    (s) => s.day >= from && s.day <= to && countsTowardDay(s, input.notDaily),
  );
}

/** `now` against `before`. Below 20% either way is `about`. */
export function compareAmounts(now: number, before: number): Comparison {
  if (before <= 0) return now > 0 ? 'muchMore' : 'about';
  const ratio = now / before;
  if (ratio >= 1.5) return 'muchMore';
  if (ratio >= 1.2) return 'more';
  if (ratio <= 0.5) return 'muchLess';
  if (ratio <= 0.8) return 'less';
  return 'about';
}

/** The key a merchant is grouped by: trimmed and case-folded. */
export function merchantKey(merchant: string): string {
  return merchant.trim().toLocaleLowerCase();
}

export const moneySlot = (value: Vnd): FactSlot => ({ type: 'money', value });
export const countSlot = (value: number): FactSlot => ({ type: 'count', value });
