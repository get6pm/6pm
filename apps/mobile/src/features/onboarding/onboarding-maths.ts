import {
  CLOSE_TIME_OPTIONS,
  dailyNumber,
  joinedShare,
  payCycleOn,
  type LocalDate,
  type Payday,
} from '@6pm/domain';

/**
 * Onboarding's numbers. The wheels read as digits of a real amount, Future you is a slice of money
 * in, and the first number comes from the same engine Today uses, so the reveal and Home agree.
 */

const MILLION = 1_000_000;
const HUNDRED_K = 100_000;
const TEN_K = 10_000;

/** The most money in a month the wheels set: 1.000.000.000₫. */
export const INCOME_MAX = 1_000_000_000;
const HUNDRED_MILLION = 100_000_000;

/**
 * Money in is set on three wheels, read as the digits of the amount: hundreds of millions (blank,
 * 1–9, or "1.0" for a billion), the millions below that (0–99, two digits once a hundreds-of-
 * millions digit is set), and hundred thousands (0–9).
 */
export const INCOME_LEADS = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '1.0'];
export function incomeMillionsItems(lead: number): string[] {
  return Array.from({ length: 100 }, (_, i) => (lead > 0 ? String(i).padStart(2, '0') : String(i)));
}
export const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
/** A bill is set as millions (0–99), hundred thousands and ten thousands. */
export const BILL_MILLIONS = Array.from({ length: 100 }, (_, i) => String(i));
/** Future you: 0–40% of money in. */
export const PERCENTS = Array.from({ length: 41 }, (_, i) => `${i}%`);

export function incomeDigits(income: number): {
  lead: number;
  millions: number;
  hundreds: number;
} {
  const amount = Math.max(MILLION, Math.min(INCOME_MAX, income));
  return {
    lead: Math.floor(amount / HUNDRED_MILLION),
    millions: Math.floor((amount % HUNDRED_MILLION) / MILLION),
    hundreds: Math.round((amount % MILLION) / HUNDRED_K) % 10,
  };
}

/** The amount the wheels read, kept between 1.000.000₫ and 1.000.000.000₫. */
export function incomeOf(lead: number, millions: number, hundreds: number): number {
  const amount = lead * HUNDRED_MILLION + millions * MILLION + hundreds * HUNDRED_K;
  return Math.max(MILLION, Math.min(INCOME_MAX, amount));
}

export function billDigits(amount: number): { millions: number; hundreds: number; tens: number } {
  return {
    millions: Math.floor(amount / MILLION),
    hundreds: Math.floor((amount % MILLION) / HUNDRED_K),
    tens: Math.floor((amount % HUNDRED_K) / TEN_K),
  };
}

export function billOf(millions: number, hundreds: number, tens: number): number {
  return millions * MILLION + hundreds * HUNDRED_K + tens * TEN_K;
}

/** Future you each payday: the percentage of money in, to the nearest 100.000₫. */
export function futureYouOf(income: number, percent: number): number {
  return Math.round((income * percent) / 100 / HUNDRED_K) * HUNDRED_K;
}

/** The close wheels: hours 15–23 and quarter hours, read from the close times the app allows. */
export const CLOSE_HOURS = [...new Set(CLOSE_TIME_OPTIONS.map((time) => time.slice(0, 2)))];
export const CLOSE_MINUTES = [...new Set(CLOSE_TIME_OPTIONS.map((time) => time.slice(3)))];

export interface FirstDayInput {
  readonly income: number;
  readonly payday: Payday;
  readonly bills: number;
  readonly futureYou: number;
}

export interface FirstDay {
  /** Today's line: safe to spend today, and each day after if nothing is spent. */
  readonly line: number;
  /** Money in less bills and Future you, for the month. */
  readonly free: number;
  /** Days the money covers, today through payday. */
  readonly days: number;
}

/** The first day's number from the domain engine, as Home will show it once onboarding ends. */
export function firstDay(input: FirstDayInput, today: LocalDate): FirstDay {
  const cycle = payCycleOn(today, input.payday);
  const { daysLeft } = cycle;
  const day = dailyNumber({
    plan: {
      income: input.income,
      bills: input.bills,
      futureYou: input.futureYou,
      occasions: 0,
      topUps: 0,
    },
    spentBefore: 0,
    today: [],
    notDaily: new Set(),
    daysLeft,
    // Joining today: only the days left of this pay cycle's money is still to spend.
    share: joinedShare(cycle, today),
  });
  return { line: Math.max(0, day.line), free: day.startFree, days: daysLeft + 1 };
}
