import { foldWords } from '../capture/spoken-spend';
import type { Vnd } from '../money/format';
import { addMonthsTo } from '../plan/plan-river';
import { answerAsk, type AskAnswer, type AskContext } from './ask-engine';

/** "When can I buy a house?", as the phone answers it. */
export type GoalAnswer =
  /** At what goes to Future you each month, the price is reached in `months`. */
  | {
      readonly kind: 'goalPace';
      readonly what: string;
      readonly amount: Vnd;
      readonly monthly: Vnd;
      readonly months: number;
      /** Whole years when it is two years or more, else null: the answer counts months. */
      readonly years: number | null;
      /** 'YYYY-MM' */
      readonly reachedIn: string;
    }
  /** Nothing goes to Future you each month, so there is no pace to count from. */
  | { readonly kind: 'goalNoPace'; readonly what: string; readonly amount: Vnd }
  /** The question named no price: the answer asks for one. */
  | { readonly kind: 'goalAmount'; readonly what: string };

/** The user's pot for this goal, when one is named for it ("nhà" → "Mua nhà"). */
function potFor(what: string, ctx: AskContext): string | undefined {
  const wanted = foldWords(what);
  if (wanted.trim().length < 2) return undefined;
  return ctx.pots.find((pot) => {
    const name = foldWords(pot.name);
    return name.includes(wanted) || wanted.includes(name);
  })?.name;
}

/**
 * A big goal: a pot kept for it answers as that pot; otherwise the price over what goes to
 * Future you each month, counted from today. Every number is the plan's own; nothing is
 * guessed about prices.
 */
export function answerGoal(
  goal: { readonly what: string; readonly amount?: number | undefined },
  ctx: AskContext,
): GoalAnswer | AskAnswer {
  const pot = potFor(goal.what, ctx);
  if (pot !== undefined) return answerAsk({ kind: 'potFull', pot }, ctx);
  if (goal.amount === undefined) return { kind: 'goalAmount', what: goal.what };
  const monthly = ctx.futureYou;
  if (monthly <= 0) return { kind: 'goalNoPace', what: goal.what, amount: goal.amount };
  const months = Math.ceil(goal.amount / monthly);
  return {
    kind: 'goalPace',
    what: goal.what,
    amount: goal.amount,
    monthly,
    months,
    years: months >= 24 ? Math.round(months / 12) : null,
    reachedIn: addMonthsTo(ctx.today.slice(0, 7), months),
  };
}
