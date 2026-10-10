import {
  CLOSE_TIME_OPTIONS,
  dailyNumber,
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

/** Money in is set as millions (1–99) and hundred thousands (0–9). */
export const INCOME_MILLIONS = Array.from({ length: 99 }, (_, i) => String(i + 1));
export const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
/** A bill is set as millions (0–50), hundred thousands and ten thousands. */
export const BILL_MILLIONS = Array.from({ length: 51 }, (_, i) => String(i));
/** Future you: 0–40% of money in. */
export const PERCENTS = Array.from({ length: 41 }, (_, i) => `${i}%`);

export function incomeDigits(income: number): { millions: number; hundreds: number } {
  return {
    millions: Math.max(1, Math.min(99, Math.floor(income / MILLION))),
    hundreds: Math.round((income % MILLION) / HUNDRED_K) % 10,
  };
}

export function incomeOf(millions: number, hundreds: number): number {
  return millions * MILLION + hundreds * HUNDRED_K;
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
  const { daysLeft } = payCycleOn(today, input.payday);
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
  });
  return { line: Math.max(0, day.line), free: day.startFree, days: daysLeft + 1 };
}
