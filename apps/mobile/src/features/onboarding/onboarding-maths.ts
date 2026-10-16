import {
  CLOSE_TIME_OPTIONS,
  dailyNumber,
  designAmount,
  joinedCycle,
  joinedShare,
  payCycleOn,
  spentSincePaydayEstimate,
  spentSincePaydayPresets,
  steps,
  VND,
  type Currency,
  type LocalDate,
  type Money,
  type MoneyFormat,
  type Payday,
} from '@6pm/domain';

/**
 * Onboarding's numbers. The wheels read as digits of a real amount, Future you is a slice of money
 * in, and the first number comes from the same engine Today uses, so the reveal and Home agree.
 * Amounts are in the home currency's minor unit; the wheels count in its step (1.000₫ in Vietnam,
 * $1 in the US), so in đồng they read millions, hundred thousands and ten thousands.
 */

/** What the "millions" wheel counts: 1.000.000₫, $1,000, ¥10,000. */
const millionOf = (c: Currency): Money => steps(1000, c);
/** The wheel after it: 100.000₫, $100. */
const hundredOf = (c: Currency): Money => steps(100, c);
/** A bill's last wheel: 10.000₫, $10. */
const tenOf = (c: Currency): Money => steps(10, c);
/** The lead wheel: 100.000.000₫, $100,000. */
const leadOf = (c: Currency): Money => steps(100_000, c);

/** The most money in a month the wheels set: 1.000.000.000₫, $1,000,000. */
export function incomeMax(c: Currency = VND): Money {
  return steps(1_000_000, c);
}

/** The design's starting money in, 15.500.000₫, worth about the same and set on the wheels. */
export function startingIncome(c: Currency = VND): Money {
  const { lead, millions, hundreds } = incomeDigits(designAmount(15_500_000, c), c);
  return incomeOf(lead, millions, hundreds, c);
}

/**
 * Where the "millions" wheel's last digit sits among the amount's whole digits, counted from the
 * right: 6 in đồng (1.000.000₫), 3 in dollars ($1,000), 4 in yen (¥10,000).
 */
export function millionsPlace(c: Currency = VND): number {
  return Math.round(Math.log10(millionOf(c) / c.minorPerMajor));
}

/** The thousands mark a money format writes: "." for đồng, "," for dollars on an English phone. */
export function groupMarkOf(money: MoneyFormat): string {
  return money.number(1000 * money.currency.minorPerMajor).charAt(1);
}

/** The group mark written after the digit at a place: "." after the millions in đồng. */
export function markAfter(place: number, mark: string): string {
  return place > 0 && place % 3 === 0 ? mark : '';
}

/** The zeros below a place, with their group marks: "00.000" below the hundred thousands. */
export function zerosBelow(place: number, mark: string): string {
  let text = '';
  for (let k = place; k >= 1; k -= 1) text += markAfter(k, mark) + '0';
  return text;
}

/** A two-digit wheel's rows, at `place` and the one above it, with a mark between when due. */
function pairItems(place: number, mark: string, pad: boolean): string[] {
  const inner = markAfter(place + 1, mark);
  return Array.from({ length: 100 }, (_, i) => {
    const text = pad ? String(i).padStart(2, '0') : String(i);
    return text.length === 2 ? text[0] + inner + text[1] : text;
  });
}

/**
 * Money in is set on three wheels, read as the digits of the amount: hundreds of millions (blank,
 * 1–9, or "1.0" for a billion), the millions below that (0–99, two digits once a hundreds-of-
 * millions digit is set), and hundred thousands (0–9). Marks fall where the currency's digits
 * group them.
 */
export function incomeLeads(c: Currency = VND, mark = '.'): string[] {
  const place = millionsPlace(c) + 2;
  const after = markAfter(place, mark);
  const leads = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => d + after);
  return ['', ...leads, '1' + markAfter(place + 1, mark) + '0' + after];
}
export function incomeMillionsItems(lead: number, c: Currency = VND, mark = '.'): string[] {
  return pairItems(millionsPlace(c), mark, lead > 0);
}
export const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
/** A bill is set as millions (0–99), hundred thousands and ten thousands. */
export function billMillionsItems(c: Currency = VND, mark = '.'): string[] {
  return pairItems(millionsPlace(c), mark, false);
}
/** Future you: 0–40% of money in. */
export const PERCENTS = Array.from({ length: 41 }, (_, i) => `${i}%`);

export function incomeDigits(
  income: Money,
  c: Currency = VND,
): { lead: number; millions: number; hundreds: number } {
  const million = millionOf(c);
  const amount = Math.max(million, Math.min(incomeMax(c), income));
  return {
    lead: Math.floor(amount / leadOf(c)),
    millions: Math.floor((amount % leadOf(c)) / million),
    hundreds: Math.round((amount % million) / hundredOf(c)) % 10,
  };
}

/** The amount the wheels read, kept between 1.000.000₫ and 1.000.000.000₫ ($1,000 to $1M). */
export function incomeOf(
  lead: number,
  millions: number,
  hundreds: number,
  c: Currency = VND,
): Money {
  const amount = lead * leadOf(c) + millions * millionOf(c) + hundreds * hundredOf(c);
  return Math.max(millionOf(c), Math.min(incomeMax(c), amount));
}

export function billDigits(
  amount: Money,
  c: Currency = VND,
): { millions: number; hundreds: number; tens: number } {
  return {
    millions: Math.floor(amount / millionOf(c)),
    hundreds: Math.floor((amount % millionOf(c)) / hundredOf(c)),
    tens: Math.floor((amount % hundredOf(c)) / tenOf(c)),
  };
}

export function billOf(millions: number, hundreds: number, tens: number, c: Currency = VND): Money {
  return millions * millionOf(c) + hundreds * hundredOf(c) + tens * tenOf(c);
}

/** Future you each payday: the percentage of money in, to the nearest 100.000₫ ($100). */
export function futureYouOf(income: Money, percent: number, c: Currency = VND): Money {
  const unit = hundredOf(c);
  return Math.round((income * percent) / 100 / unit) * unit;
}
/** The close wheels: hours 15–23 and quarter hours, read from the close times the app allows. */
export const CLOSE_HOURS = [...new Set(CLOSE_TIME_OPTIONS.map((time) => time.slice(0, 2)))];
export const CLOSE_MINUTES = [...new Set(CLOSE_TIME_OPTIONS.map((time) => time.slice(3)))];

export interface FirstDayInput {
  readonly income: number;
  readonly payday: Payday;
  readonly bills: number;
  readonly futureYou: number;
  /** "Since payday, about how much have you spent?": null until the person changes the prefill. */
  readonly spentSincePayday?: number | null;
  /** "Start Future you at payday" was chosen. */
  readonly futureYouAtPayday?: boolean;
}

export interface FirstDay {
  /** Today's line: safe to spend today, and each day after if nothing is spent. */
  readonly line: number;
  /** What is left to spend until payday: money in less bills, Future you and what went before. */
  readonly free: number;
  /** Days the money covers, today through payday. */
  readonly days: number;
  /** The payday the cycle began on; joining after it asks what went since. */
  readonly since: LocalDate;
  /** The payday that ends it, when Future you starts if it starts at payday. */
  readonly payday: LocalDate;
  /** Joining part-way through a pay cycle: the "spent since payday" line shows. */
  readonly joined: boolean;
  /** The person's answer, or the prefill when there is none. */
  readonly spentSincePayday: number;
  /** Amounts to pick from beside the keypad. */
  readonly presets: readonly number[];
  /** The cycle starts with more spent than its free money. */
  readonly overspent: boolean;
  /** "Start Future you at payday" is offered: the cycle would start overspent with Future you. */
  readonly offerFutureYouAtPayday: boolean;
  /** Future you is skipped this cycle. */
  readonly futureYouSkipped: boolean;
}

/** The first day's number from the domain engine, as Home will show it once onboarding ends. */
export function firstDay(
  input: FirstDayInput,
  today: LocalDate,
  currency: Currency = VND,
): FirstDay {
  const cycle = payCycleOn(today, input.payday);
  const { daysLeft } = cycle;
  const day = (futureYouAtPayday: boolean) => {
    // Joining today: what went since payday is the person's answer, or the even-pace estimate.
    const joined = joinedCycle(cycle, {
      on: today,
      spentSincePayday: input.spentSincePayday ?? null,
      futureYouAtPayday,
    });
    return {
      joined,
      day: dailyNumber({
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
        share: joined.share,
        beforeJoining: joined.beforeJoining,
        futureYouSkipped: joined.futureYouSkipped,
        currency,
      }),
    };
  };
  const whole = day(false);
  const offer = whole.joined.joined && whole.day.overspent && input.futureYou > 0;
  const { joined, day: shown } = day(offer && input.futureYouAtPayday === true);
  const planned = input.income - input.bills - input.futureYou;
  const estimate = spentSincePaydayEstimate(planned, joinedShare(cycle, today), currency);
  return {
    line: Math.max(0, shown.line),
    free: shown.startFree,
    days: daysLeft + 1,
    since: cycle.start,
    payday: cycle.payday,
    joined: joined.joined,
    spentSincePayday: joined.beforeJoining ?? estimate,
    presets: spentSincePaydayPresets(planned, estimate, currency),
    overspent: shown.overspent,
    offerFutureYouAtPayday: offer,
    futureYouSkipped: joined.futureYouSkipped,
  };
}
