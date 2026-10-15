import { designAmount, VND } from '../money/currency';
import type { SpendSource } from '../spend/spend';
import { addDays, diffDays, startOfWeek, weekdayMondayFirst } from '../time/local-date';
import {
  countedSpends,
  countSlot,
  merchantKey,
  moneySlot,
  type Fact,
  type InsightInput,
  type InsightSpend,
} from './fact';

/** Habits are read over this many days before today, and only once the log goes back that far. */
const HABIT_SPAN = 28;
/** Weekend days spend at least this many times a weekday before it is worth a word. */
const WEEKEND_TIMES = 1.5;
/** A weekend day under this on average is not worth a word, whatever the ratio. */
const MIN_WEEKEND_DONG = 100_000;
/** Told from Friday, as the weekend comes. */
const WEEKEND_FROM = 4;
/** A record day is at least this many times the line, and never under the floor. */
const RECORD_LINE_TIMES = 2;
const RECORD_FLOOR_DONG = 150_000;
/** A subscription: this many charges, about a month apart, at about the same amount. */
const SUBSCRIPTION_CHARGES = 3;
const MONTH_GAP = { min: 25, max: 35 } as const;
const SAME_AMOUNT = 0.1;
/** A subscription is told this many days after its latest charge, at most. */
const SUBSCRIPTION_FRESH = 6;
/** Late at night: from 23:00 to 04:00 on the phone's clock. */
const LATE_FROM = 23;
const LATE_UNTIL = 4;
/** Sources that record the moment of payment, not the moment it was typed in. */
const TIMED_SOURCES: ReadonlySet<SpendSource> = new Set(['applePay', 'email', 'qr']);

/** The first day the log holds a spend, when it goes back at least `days` before today. */
function historyFrom(input: InsightInput, days: number): string | null {
  const first = input.spends.reduce<string | null>(
    (min, s) => (s.status !== 'deleted' && (min === null || s.day < min) ? s.day : min),
    null,
  );
  return first !== null && diffDays(input.today, first) >= days ? first : null;
}

function totalsByDay(spends: readonly InsightSpend[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const s of spends) totals.set(s.day, (totals.get(s.day) ?? 0) + s.amount);
  return totals;
}

/** Weekend days spending well over weekdays across the last four weeks, told from Friday. */
export function weekendHeavyFacts(input: InsightInput): Fact[] {
  const { today } = input;
  if (weekdayMondayFirst(today) < WEEKEND_FROM || historyFrom(input, HABIT_SPAN) === null) {
    return [];
  }
  const from = addDays(today, -HABIT_SPAN);
  const totals = totalsByDay(countedSpends(input, from, addDays(today, -1)));
  const sums = { weekend: 0, weekendDays: 0, weekday: 0, weekdays: 0 };
  for (let i = 0; i < HABIT_SPAN; i += 1) {
    const date = addDays(from, i);
    const spent = totals.get(date) ?? 0;
    if (weekdayMondayFirst(date) >= 5) {
      sums.weekend += spent;
      sums.weekendDays += 1;
    } else {
      sums.weekday += spent;
      sums.weekdays += 1;
    }
  }
  const weekend = Math.round(sums.weekend / sums.weekendDays);
  const weekday = Math.round(sums.weekday / sums.weekdays);
  const minimum = designAmount(MIN_WEEKEND_DONG, input.currency ?? VND);
  if (weekend < minimum || weekend < weekday * WEEKEND_TIMES) return [];
  return [
    {
      kind: 'weekendHeavy',
      key: `weekendHeavy:${startOfWeek(today)}`,
      tone: 'neutral',
      salience: 0.4,
      repeatAfterDays: 14,
      slots: { weekend: moneySlot(weekend), weekday: moneySlot(weekday) },
    },
  ];
}

/** Today is the biggest day the log holds, over a month of it at least. */
export function recordDayFacts(input: InsightInput): Fact[] {
  const { today } = input;
  const first = historyFrom(input, HABIT_SPAN);
  if (first === null) return [];
  const todays = countedSpends(input, today, today);
  const amount = todays.reduce((sum, s) => sum + s.amount, 0);
  const floor = designAmount(RECORD_FLOOR_DONG, input.currency ?? VND);
  if (amount < Math.max(floor, input.day.line * RECORD_LINE_TIMES)) return [];
  const before = totalsByDay(countedSpends(input, first, addDays(today, -1)));
  if ([...before.values()].some((total) => total >= amount)) return [];
  return [
    {
      kind: 'recordDay',
      key: `recordDay:${today}`,
      tone: 'watch',
      salience: 0.6,
      repeatAfterDays: 1,
      slots: { amount: moneySlot(amount), days: countSlot(diffDays(today, first)) },
      about: [...new Set(todays.map((s) => s.category))],
    },
  ];
}

/** Charges a month apart at about the same amount: the last `SUBSCRIPTION_CHARGES`, or none. */
function monthlyRun(spends: readonly InsightSpend[]): InsightSpend[] {
  const run = spends.slice(-SUBSCRIPTION_CHARGES);
  const latest = run.at(-1);
  if (latest === undefined || run.length < SUBSCRIPTION_CHARGES || latest.amount <= 0) return [];
  for (let i = 1; i < run.length; i += 1) {
    const gap = diffDays(run[i]?.day ?? '', run[i - 1]?.day ?? '');
    if (gap < MONTH_GAP.min || gap > MONTH_GAP.max) return [];
  }
  const same = run.every((s) => Math.abs(s.amount - latest.amount) <= latest.amount * SAME_AMOUNT);
  return same ? run : [];
}

/** A place charging about the same each month that is not a bill yet: likely a subscription. */
export function likelySubscriptionFacts(input: InsightInput): Fact[] {
  const bills = new Set(input.bills.map((b) => merchantKey(b.name)));
  const byMerchant = new Map<string, InsightSpend[]>();
  for (const s of input.spends) {
    const key = merchantKey(s.merchant);
    if (key === '' || bills.has(key) || s.status === 'skipped' || s.status === 'deleted') continue;
    if (s.day > input.today) continue;
    byMerchant.set(key, [...(byMerchant.get(key) ?? []), s]);
  }
  const facts: Fact[] = [];
  for (const [key, spends] of byMerchant) {
    const run = monthlyRun([...spends].sort((a, b) => a.day.localeCompare(b.day)));
    const latest = run.at(-1);
    if (latest === undefined || diffDays(input.today, latest.day) > SUBSCRIPTION_FRESH) continue;
    facts.push({
      kind: 'likelySubscription',
      key: `likelySubscription:${key}`,
      tone: 'neutral',
      salience: 0.45,
      repeatAfterDays: 90,
      slots: {
        merchant: { type: 'merchant', value: latest.merchant.trim() },
        amount: moneySlot(latest.amount),
        months: countSlot(run.length),
      },
      about: [...new Set(run.map((s) => s.category))],
    });
  }
  return facts.sort((a, b) => a.key.localeCompare(b.key));
}

const isLate = (hour: number) => hour >= LATE_FROM || hour < LATE_UNTIL;

/** A payment made late at night, last night or tonight; told once a week at most. */
export function lateNightFacts(input: InsightInput): Fact[] {
  const late = countedSpends(input, addDays(input.today, -1), input.today)
    .filter((s) => s.hour !== undefined && isLate(s.hour) && TIMED_SOURCES.has(s.source))
    .filter((s) => merchantKey(s.merchant) !== '')
    .sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id))[0];
  if (late === undefined) return [];
  return [
    {
      kind: 'lateNight',
      key: `lateNight:${startOfWeek(input.today)}`,
      tone: 'neutral',
      salience: 0.4,
      repeatAfterDays: 7,
      slots: {
        merchant: { type: 'merchant', value: late.merchant.trim() },
        amount: moneySlot(late.amount),
      },
      about: [late.category],
    },
  ];
}
