import { slotsOf, type Fact } from '../insights/fact';
import type { AskContext } from './ask-engine';
import { rankedFacts, type AskLedger } from './ask-ledger';
import type { ChatTopic } from './chat-topics';

/** Categories a roast never touches: health, rent and the home, family, and gifts. */
export const NEVER_ROAST: ReadonlySet<string> = new Set(['health', 'home', 'family', 'gifts']);

/** Facts a roast is built on: spending worth a tease. */
const ROASTABLE: ReadonlySet<Fact['kind']> = new Set([
  'repeatMerchant',
  'biggestSpend',
  'categoryPace',
  'todayOver',
  'weekOver',
  'firstTimeMerchant',
]);

/** Facts that lift someone: what is going right. */
const UPLIFTING: ReadonlySet<Fact['kind']> = new Set([
  'underStreak',
  'closeStreak',
  'weekSpare',
  'todayUnder',
  'potMilestone',
  'potFull',
  'paydaySoon',
  'noSpendYet',
]);

export interface ChatAnswer {
  readonly kind: 'chat';
  readonly topic: ChatTopic | null;
  /** The true thing a roast, a hype or a word of comfort is built on; null when none fits. */
  readonly fact: Fact | null;
}

/** A spend at this place was in a category a roast never touches. */
function touchesNeverRoast(fact: Fact, ledger: AskLedger): boolean {
  const slots = slotsOf(fact);
  const category = slots['category'];
  if (category?.type === 'category' && NEVER_ROAST.has(category.id)) return true;
  const merchant = slots['merchant'];
  if (merchant?.type !== 'merchant') return false;
  return ledger.spends.some((s) => s.merchant === merchant.value && NEVER_ROAST.has(s.category));
}

function roastable(fact: Fact, ledger: AskLedger): boolean {
  if (!ROASTABLE.has(fact.kind) || touchesNeverRoast(fact, ledger)) return false;
  // A category spending less is no roast.
  const compare = slotsOf(fact)['compare'];
  return compare?.type !== 'compare' || compare.value === 'more' || compare.value === 'muchMore';
}

/**
 * Small talk, answered without numbers unless one helps: a roast teases a real spend, a hype or
 * a word of comfort names something going right. Distress, investing and unsafe questions get
 * no fact at all.
 */
export function answerChat(
  topic: ChatTopic | undefined,
  ctx: AskContext,
  ledger: AskLedger | null,
): ChatAnswer {
  const t = topic ?? null;
  if (ledger === null || (t !== 'roast' && t !== 'hype' && t !== 'venting')) {
    return { kind: 'chat', topic: t, fact: null };
  }
  const facts = rankedFacts(ledger, ctx);
  const fact =
    t === 'roast'
      ? facts.find((f) => roastable(f, ledger))
      : facts.find((f) => UPLIFTING.has(f.kind));
  return { kind: 'chat', topic: t, fact: fact ?? null };
}
