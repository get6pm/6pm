import { designAmount, VND } from '../money/currency';
import { countsTowardDay } from '../spend/spend';
import { addDays, diffDays, startOfWeek } from '../time/local-date';
import {
  compareAmounts,
  countSlot,
  merchantKey,
  moneySlot,
  type Fact,
  type InsightInput,
  type InsightSpend,
} from './fact';

/** A category is compared only once this many days of the cycle have passed. */
const MIN_PACE_DAYS = 3;
/** Neither side of a comparison under this is worth a word (the design's 100k). */
const MIN_PACE_DONG = 100_000;
/** At most this many category comparisons, the biggest changes first. */
const MAX_PACE_FACTS = 2;
const REPEAT_VISITS = 3;
/** A spend is "big" at this many times today's line, and never under the floor (the design's 150k). */
const BIG_LINE_TIMES = 2;
const BIG_FLOOR_DONG = 150_000;

function counted(input: InsightInput, from: string, to: string): InsightSpend[] {
  return input.spends.filter(
    (s) => s.day >= from && s.day <= to && countsTowardDay(s, input.notDaily),
  );
}

function byCategory(spends: readonly InsightSpend[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const s of spends) totals.set(s.category, (totals.get(s.category) ?? 0) + s.amount);
  return totals;
}

/**
 * Categories running well ahead of or behind the same days of the last cycle. Spending more is a
 * gentle "watch", spending less a "good"; a change under 20% is not told.
 */
export function categoryPaceFacts(input: InsightInput): Fact[] {
  const { previousCycleStart, cycle, today } = input;
  const elapsed = diffDays(today, cycle.start);
  if (previousCycleStart === null || elapsed < MIN_PACE_DAYS) return [];
  const previousEnd = addDays(previousCycleStart, elapsed);
  if (previousEnd >= cycle.start) return [];

  const now = byCategory(counted(input, cycle.start, today));
  const before = byCategory(counted(input, previousCycleStart, previousEnd));
  const minimum = designAmount(MIN_PACE_DONG, input.currency ?? VND);
  const facts: { fact: Fact; change: number }[] = [];
  for (const category of new Set([...now.keys(), ...before.keys()])) {
    const a = now.get(category) ?? 0;
    const b = before.get(category) ?? 0;
    if (a < minimum && b < minimum) continue;
    // A category new this cycle has nothing to be measured against.
    if (b === 0) continue;
    const word = compareAmounts(a, b);
    if (word === 'about') continue;
    const change = Math.abs(Math.log2(Math.max(a, 1) / b));
    const more = word === 'more' || word === 'muchMore';
    facts.push({
      change,
      fact: {
        kind: 'categoryPace',
        key: `categoryPace:${category}:${word}`,
        tone: more ? 'watch' : 'good',
        salience: 0.5 + Math.min(0.25, change * 0.15),
        repeatAfterDays: 7,
        slots: {
          category: { type: 'category', id: category },
          now: moneySlot(a),
          before: moneySlot(b),
          compare: { type: 'compare', value: word },
        },
      },
    });
  }
  return facts
    .sort((x, y) => y.change - x.change || x.fact.key.localeCompare(y.fact.key))
    .slice(0, MAX_PACE_FACTS)
    .map((f) => f.fact);
}

/** Places visited again and again this week: "the 4th Highlands since Monday". */
export function repeatMerchantFacts(input: InsightInput): Fact[] {
  const groups = new Map<string, { merchant: string; visits: number; amount: number }>();
  for (const s of counted(input, startOfWeek(input.today), input.today)) {
    const key = merchantKey(s.merchant);
    if (key === '') continue;
    const group = groups.get(key) ?? { merchant: s.merchant.trim(), visits: 0, amount: 0 };
    group.visits += 1;
    group.amount += s.amount;
    groups.set(key, group);
  }
  return [...groups.entries()]
    .filter(([, g]) => g.visits >= REPEAT_VISITS)
    .sort(([, a], [, b]) => b.visits - a.visits || b.amount - a.amount)
    .map(([key, g]): Fact => ({
      kind: 'repeatMerchant',
      key: `repeatMerchant:${key}:${g.visits}`,
      tone: 'neutral',
      salience: Math.min(0.7, 0.4 + 0.05 * g.visits),
      repeatAfterDays: 3,
      slots: {
        merchant: { type: 'merchant', value: g.merchant },
        visits: countSlot(g.visits),
        amount: moneySlot(g.amount),
      },
    }));
}

/** Today's places never seen before in the span the phone looked at. */
export function firstTimeFacts(input: InsightInput): Fact[] {
  const seen = new Set(
    input.spends.filter((s) => s.day < input.today).map((s) => merchantKey(s.merchant)),
  );
  // Without an earlier span to look at, everything would be "new".
  if (seen.size === 0) return [];
  const firsts = new Map<string, InsightSpend>();
  for (const s of counted(input, input.today, input.today)) {
    const key = merchantKey(s.merchant);
    if (key !== '' && !seen.has(key) && !firsts.has(key)) firsts.set(key, s);
  }
  return [...firsts.entries()].map(([key, s]): Fact => ({
    kind: 'firstTimeMerchant',
    key: `firstTimeMerchant:${key}`,
    tone: 'neutral',
    salience: 0.3,
    repeatAfterDays: 365,
    slots: {
      merchant: { type: 'merchant', value: s.merchant.trim() },
      amount: moneySlot(s.amount),
    },
  }));
}

/** The week's biggest spend, when it stands out against the daily line. */
export function biggestSpendFacts(input: InsightInput): Fact[] {
  const bigFloor = designAmount(BIG_FLOOR_DONG, input.currency ?? VND);
  const floor = Math.max(bigFloor, input.day.line * BIG_LINE_TIMES);
  const biggest = counted(input, startOfWeek(input.today), input.today)
    .filter((s) => s.amount >= floor)
    .sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id))[0];
  if (biggest === undefined) return [];
  return [
    {
      kind: 'biggestSpend',
      key: `biggestSpend:${biggest.id}`,
      tone: 'neutral',
      salience: 0.45,
      repeatAfterDays: 7,
      slots: {
        merchant: { type: 'merchant', value: biggest.merchant.trim() },
        amount: moneySlot(biggest.amount),
        category: { type: 'category', id: biggest.category },
      },
    },
  ];
}
