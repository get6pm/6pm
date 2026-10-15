import type { Vnd } from '../money/format';
import { compareAmounts, type Comparison, type Fact } from '../insights/fact';
import type { LocalDate } from '../time/local-date';
import { answerAsk, type AskAnswer, type AskContext } from './ask-engine';
import type { AskIntent } from './ask-intent';
import {
  dueBills,
  matchCategory,
  matching,
  placesOf,
  topFacts,
  totalOf,
  type AskFilter,
  type AskLedger,
  type AskListedSpend,
  type AskPlace,
  type AskShare,
  type AskTotal,
} from './ask-ledger';
import {
  rangeBefore,
  resolveRange,
  type AskQuery,
  type RangeFrame,
  type ResolvedRange,
} from './ask-query';

const LIST_LIMIT = 8;
const BREAKDOWN_LIMIT = 5;

/** An answer to any question: the original answers, plus answers read from the ledger. */
export type AskQueryAnswer =
  | AskAnswer
  | {
      readonly kind: 'spent';
      readonly spent: AskTotal;
      readonly categoryId: string | null;
      readonly merchant: string | null;
      /** Where it went, when the question named no category or place. */
      readonly places: readonly AskPlace[];
      /** The span starts before the records the phone keeps: the total covers what it has. */
      readonly partial: boolean;
    }
  | {
      readonly kind: 'breakdown';
      readonly spent: AskTotal;
      readonly categories: readonly AskShare[];
      readonly places: readonly AskPlace[];
      readonly partial: boolean;
    }
  | {
      readonly kind: 'compared';
      readonly now: AskTotal;
      readonly before: AskTotal;
      readonly compare: Comparison;
      readonly categoryId: string | null;
      readonly merchant: string | null;
      readonly partial: boolean;
    }
  | {
      readonly kind: 'listed';
      readonly range: ResolvedRange;
      readonly spends: readonly AskListedSpend[];
      /** Matching spends not shown. */
      readonly more: number;
      readonly total: Vnd;
      readonly partial: boolean;
    }
  | {
      readonly kind: 'bills';
      readonly due: readonly {
        readonly id: string;
        readonly name: string;
        readonly amount: Vnd;
        readonly on: LocalDate;
      }[];
      readonly total: Vnd;
      readonly paid: number;
    }
  | { readonly kind: 'howAmIDoing'; readonly facts: readonly Fact[] }
  | { readonly kind: 'noSuchCategory'; readonly name: string }
  | { readonly kind: 'noRange' }
  | { readonly kind: 'chat' };

const INTENT_KINDS = new Set(['afford', 'weekend', 'saveMore', 'potFull', 'today', 'unknown']);

/** One of the original intents, which the original engine answers. */
function isIntent(query: AskQuery): query is AskIntent {
  return INTENT_KINDS.has(query.kind);
}

/** Works out the answer to any question from the user's own numbers and records. */
export function answerQuery(
  query: AskQuery,
  ctx: AskContext,
  ledger: AskLedger | null,
): AskQueryAnswer {
  if (isIntent(query)) return answerAsk(query, ctx);
  if (query.kind === 'chat') return { kind: 'chat' };
  if (ledger === null) return { kind: 'help' };
  const frame: RangeFrame = {
    today: ctx.today,
    cycleStart: ledger.cycleStart,
    previousCycleStart: ledger.previousCycleStart,
  };

  if (query.kind === 'bills') return { kind: 'bills', ...dueBills(ledger, ctx.today, ctx.payday) };
  if (query.kind === 'howAmIDoing') return { kind: 'howAmIDoing', facts: topFacts(ledger, ctx) };

  const range = resolveRange(query.range, frame);
  if (range === null) return { kind: 'noRange' };
  const partial = range.from < ledger.since;

  let filter: AskFilter = { categoryId: null, merchant: null };
  if ('category' in query && query.category !== undefined) {
    const category = matchCategory(query.category, ledger.categories);
    if (category === null) return { kind: 'noSuchCategory', name: query.category };
    filter = { ...filter, categoryId: category.id };
  }
  if ('merchant' in query && query.merchant !== undefined) {
    filter = { ...filter, merchant: query.merchant };
  }

  switch (query.kind) {
    case 'spend': {
      const spends = matching(ledger, range, filter);
      const unfiltered = filter.categoryId === null && filter.merchant === null;
      return {
        kind: 'spent',
        spent: totalOf(range, spends),
        ...filter,
        places: unfiltered ? placesOf(spends) : [],
        partial,
      };
    }
    case 'breakdown': {
      const spends = matching(ledger, range, filter);
      const byCategory = new Map<string, number>();
      for (const s of spends)
        byCategory.set(s.category, (byCategory.get(s.category) ?? 0) + s.amount);
      const categories = [...byCategory.entries()]
        .map(([categoryId, amount]) => ({ categoryId, amount }))
        .sort((a, b) => b.amount - a.amount || a.categoryId.localeCompare(b.categoryId))
        .slice(0, BREAKDOWN_LIMIT);
      return {
        kind: 'breakdown',
        spent: totalOf(range, spends),
        categories,
        places: placesOf(spends),
        partial,
      };
    }
    case 'compare': {
      const against =
        query.against === undefined
          ? rangeBefore(range, frame)
          : resolveRange(query.against, frame);
      if (against === null) return { kind: 'noRange' };
      const now = totalOf(range, matching(ledger, range, filter));
      const before = totalOf(against, matching(ledger, against, filter));
      return {
        kind: 'compared',
        now,
        before,
        compare: compareAmounts(now.total, before.total),
        ...filter,
        partial: partial || against.from < ledger.since,
      };
    }
    case 'list': {
      const minAmount = query.minAmount ?? 0;
      const spends = matching(ledger, range, filter)
        .filter((s) => s.amount >= minAmount)
        .sort((a, b) => b.day.localeCompare(a.day) || b.amount - a.amount);
      return {
        kind: 'listed',
        range,
        spends: spends.slice(0, LIST_LIMIT).map((s) => ({
          id: s.id,
          day: s.day,
          merchant: s.merchant.trim(),
          amount: s.amount,
          categoryId: s.category,
        })),
        more: Math.max(0, spends.length - LIST_LIMIT),
        total: spends.reduce((sum, s) => sum + s.amount, 0),
        partial,
      };
    }
  }
}
