import { floorToThousand, type Vnd } from '../money/format';
import type { DailyNumber } from '../plan/daily-number';
import { addMonthsTo } from '../plan/plan-river';
import { addDays, weekdayMondayFirst, type LocalDate } from '../time/local-date';
import type { AskIntent } from './ask-intent';

/** A pot as Ask sees it: what it holds, what it needs and what goes in each month. */
export interface AskPot {
  readonly name: string;
  readonly goal: Vnd;
  readonly saved: Vnd;
  readonly monthly: Vnd;
}

export interface AskContext {
  /** The money day the question is asked on (see `filingDay`). */
  readonly today: LocalDate;
  readonly day: DailyNumber;
  /** Days after today through payday. */
  readonly daysLeft: number;
  readonly payday: LocalDate;
  /** Future you each month, as the plan stands. */
  readonly futureYou: Vnd;
  readonly pots: readonly AskPot[];
}

/** The before/after bar under an answer: tomorrow's line now, and with the question's change. */
export interface AskBars {
  readonly before: Vnd;
  readonly after: Vnd;
}

/**
 * An answer, as numbers and a verdict. The words come from the copy catalogue (or the server's
 * model, given only these facts), so the maths never depends on how it is phrased.
 */
export type AskAnswer =
  | { readonly kind: 'fitsToday'; readonly amount: Vnd; readonly safe: Vnd; readonly bars: AskBars }
  | {
      readonly kind: 'notThisMonth';
      readonly amount: Vnd;
      readonly free: Vnd;
      readonly payday: LocalDate;
      readonly bars: AskBars;
    }
  | {
      readonly kind: 'tight';
      readonly amount: Vnd;
      readonly free: Vnd;
      readonly bars: AskBars;
      /** Taking this much back from the pots would keep `withPots` a day. */
      readonly fromPots: { readonly take: Vnd; readonly withPots: Vnd } | null;
    }
  | { readonly kind: 'fits'; readonly amount: Vnd; readonly free: Vnd; readonly bars: AskBars }
  | {
      readonly kind: 'weekend';
      readonly days: readonly { readonly day: LocalDate; readonly amount: Vnd }[];
      readonly total: Vnd;
    }
  | {
      readonly kind: 'saveMore';
      readonly amount: Vnd;
      readonly futureYou: Vnd;
      readonly perDay: Vnd;
      readonly bars: AskBars;
    }
  | {
      readonly kind: 'potFull';
      readonly pot: AskPot;
      /** 'YYYY-MM' the pot fills in, or null when nothing goes in each month. */
      readonly fullIn: string | null;
      readonly full: boolean;
    }
  | { readonly kind: 'noPots' }
  /** The question named a pot the user doesn't have. */
  | { readonly kind: 'noSuchPot'; readonly name: string }
  | { readonly kind: 'today'; readonly safe: Vnd; readonly tomorrow: Vnd }
  | { readonly kind: 'help' };

/** Below this share of today's line, the days after a spend count as tight (the design's 0,6). */
const TIGHT = 0.6;
/** The most the "take it from Occasions" suggestion moves (the design's 1tr). */
const POT_SUGGESTION = 1_000_000;

/** Tomorrow's line if `free` had to last the days left. */
function lineFrom(free: Vnd, daysLeft: number): Vnd {
  return daysLeft > 0 ? floorToThousand(free / daysLeft) : Math.max(0, free);
}

/** Works out the answer to a question from the user's own numbers. */
export function answerAsk(intent: AskIntent, ctx: AskContext): AskAnswer {
  const { day, daysLeft } = ctx;
  switch (intent.kind) {
    case 'afford': {
      const amount = intent.amount;
      const free = day.free;
      const after = lineFrom(free - amount, daysLeft);
      const bars = { before: day.tomorrow, after: Math.max(0, after) };
      if (amount <= Math.max(0, day.safe)) {
        return {
          kind: 'fitsToday',
          amount,
          safe: day.safe,
          bars: { ...bars, after: day.tomorrow },
        };
      }
      if (after <= 0) return { kind: 'notThisMonth', amount, free, payday: ctx.payday, bars };
      if (after < day.line * TIGHT) {
        const inPots = ctx.pots.reduce((sum, pot) => sum + pot.saved, 0);
        const take = Math.min(POT_SUGGESTION, inPots);
        const fromPots =
          take > 0 ? { take, withPots: lineFrom(free - amount + take, daysLeft) } : null;
        return { kind: 'tight', amount, free, bars, fromPots };
      }
      return { kind: 'fits', amount, free, bars };
    }
    case 'weekend': {
      // The coming Saturday and Sunday that the money still has to cover, at tomorrow's line.
      const days: { day: LocalDate; amount: Vnd }[] = [];
      for (let i = 1; i <= Math.min(7, daysLeft); i += 1) {
        const date = addDays(ctx.today, i);
        if (weekdayMondayFirst(date) >= 5) days.push({ day: date, amount: day.tomorrow });
        if (days.length === 2) break;
      }
      return { kind: 'weekend', days, total: days.reduce((sum, d) => sum + d.amount, 0) };
    }
    case 'saveMore': {
      const after = Math.max(0, lineFrom(day.free - intent.amount, daysLeft));
      return {
        kind: 'saveMore',
        amount: intent.amount,
        futureYou: ctx.futureYou,
        perDay: day.tomorrow - after,
        bars: { before: day.tomorrow, after },
      };
    }
    case 'potFull': {
      if (ctx.pots.length === 0) return { kind: 'noPots' };
      const wanted = intent.pot?.toLowerCase().trim();
      // A named pot must be one of the user's; with no name, the first pot is the one meant.
      const pot =
        wanted === undefined || wanted === ''
          ? ctx.pots[0]
          : ctx.pots.find((p) => {
              const name = p.name.toLowerCase();
              return name.includes(wanted) || wanted.includes(name);
            });
      if (pot === undefined) return { kind: 'noSuchPot', name: intent.pot ?? '' };
      const left = Math.max(0, pot.goal - pot.saved);
      if (left === 0) return { kind: 'potFull', pot, fullIn: ctx.today.slice(0, 7), full: true };
      const fullIn =
        pot.monthly > 0 ? addMonthsTo(ctx.today.slice(0, 7), Math.ceil(left / pot.monthly)) : null;
      return { kind: 'potFull', pot, fullIn, full: false };
    }
    case 'today':
      return { kind: 'today', safe: day.safe, tomorrow: day.tomorrow };
    case 'unknown':
      return { kind: 'help' };
  }
}
