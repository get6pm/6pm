import type { ClosedDayTotal } from '../diary/calendar';
import { foldWords } from '../capture/spoken-spend';
import type { Vnd } from '../money/format';
import {
  merchantKey,
  type Fact,
  type InsightBill,
  type InsightPot,
  type InsightSpend,
} from '../insights/fact';
import { nextDueDate } from '../insights/day-facts';
import { collectFacts } from '../insights/moment';
import type { LocalDate } from '../time/local-date';
import type { AskContext } from './ask-engine';
import type { ResolvedRange } from './ask-query';

/** The user's own records an answer may read. Built on the phone; it never leaves it. */
export interface AskLedger {
  readonly cycleStart: LocalDate;
  readonly previousCycleStart: LocalDate | null;
  /** The first day `spends` and `closed` cover; earlier spans are answered as far as they go. */
  readonly since: LocalDate;
  readonly spends: readonly InsightSpend[];
  readonly closed: readonly ClosedDayTotal[];
  readonly categories: readonly { readonly id: string; readonly name: string }[];
  readonly notDaily: ReadonlySet<string>;
  readonly bills: readonly InsightBill[];
  readonly pots: readonly InsightPot[];
}

export interface AskTotal {
  readonly range: ResolvedRange;
  readonly total: Vnd;
  readonly count: number;
}

export interface AskShare {
  readonly categoryId: string;
  readonly amount: Vnd;
}

export interface AskPlace {
  readonly merchant: string;
  readonly visits: number;
  readonly amount: Vnd;
}

export interface AskListedSpend {
  readonly id: string;
  readonly day: LocalDate;
  readonly merchant: string;
  readonly amount: Vnd;
  readonly categoryId: string;
}

const PLACES_LIMIT = 3;
const HOW_LIMIT = 3;

/** A name matched against the user's own: same words, or one holding the other. */
export function matchCategory(
  wanted: string,
  categories: AskLedger['categories'],
): { readonly id: string; readonly name: string } | null {
  const w = foldWords(wanted);
  if (w.trim() === '') return null;
  const folded = categories.map((c) => ({ c, f: foldWords(c.name) }));
  const exact = folded.find(({ f }) => f === w);
  if (exact !== undefined) return exact.c;
  const partial = folded.find(({ f }) => f.trim().length >= 3 && (f.includes(w) || w.includes(f)));
  return partial?.c ?? null;
}

export function real(s: InsightSpend): boolean {
  return s.status !== 'skipped' && s.status !== 'deleted';
}

export function within(range: ResolvedRange, s: InsightSpend): boolean {
  return s.day >= range.from && s.day <= range.to;
}

export interface AskFilter {
  readonly categoryId: string | null;
  readonly merchant: string | null;
}

export function matching(
  ledger: AskLedger,
  range: ResolvedRange,
  filter: AskFilter,
): InsightSpend[] {
  const place = filter.merchant === null ? null : foldWords(filter.merchant);
  return ledger.spends.filter(
    (s) =>
      real(s) &&
      within(range, s) &&
      (filter.categoryId === null || s.category === filter.categoryId) &&
      (place === null || foldWords(s.merchant).includes(place)),
  );
}

export function totalOf(range: ResolvedRange, spends: readonly InsightSpend[]): AskTotal {
  return { range, total: spends.reduce((sum, s) => sum + s.amount, 0), count: spends.length };
}

export function placesOf(spends: readonly InsightSpend[]): AskPlace[] {
  const groups = new Map<string, AskPlace>();
  for (const s of spends) {
    const key = merchantKey(s.merchant);
    const g = groups.get(key) ?? { merchant: s.merchant.trim(), visits: 0, amount: 0 };
    groups.set(key, { ...g, visits: g.visits + 1, amount: g.amount + s.amount });
  }
  return [...groups.values()]
    .sort((a, b) => b.amount - a.amount || a.merchant.localeCompare(b.merchant))
    .slice(0, PLACES_LIMIT);
}

/** Unpaid bills falling due on or before payday, soonest first. */
export function dueBills(ledger: AskLedger, today: LocalDate, payday: LocalDate) {
  const due = ledger.bills
    .filter((b) => !b.paid && b.amount > 0)
    .map((b) => ({ id: b.id, name: b.name, amount: b.amount, on: nextDueDate(b, today) }))
    .filter((b) => b.on <= payday)
    .sort((a, b) => a.on.localeCompare(b.on) || a.name.localeCompare(b.name));
  return {
    due,
    total: due.reduce((sum, b) => sum + b.amount, 0),
    paid: ledger.bills.filter((b) => b.paid).length,
  };
}

/** The few facts most worth knowing right now, one of each kind. */
export function topFacts(ledger: AskLedger, ctx: AskContext): Fact[] {
  const facts = collectFacts({
    today: ctx.today,
    day: ctx.day,
    cycle: { start: ledger.cycleStart, payday: ctx.payday, daysLeft: ctx.daysLeft },
    previousCycleStart: ledger.previousCycleStart,
    spends: ledger.spends,
    closed: ledger.closed,
    notDaily: ledger.notDaily,
    bills: ledger.bills,
    pots: ledger.pots,
  });
  const seen = new Set<string>();
  const top = [...facts]
    .sort((a, b) => b.salience - a.salience || a.key.localeCompare(b.key))
    .filter((f) => (seen.has(f.kind) ? false : (seen.add(f.kind), true)))
    .slice(0, HOW_LIMIT);
  return top;
}
