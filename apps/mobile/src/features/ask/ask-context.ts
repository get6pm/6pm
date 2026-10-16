import {
  cycleFutureYou,
  type AskContext,
  type AskLedger,
  type AskPot,
  type SpendRow,
} from '@6pm/domain';

import { dailyInputOf, dayOf, type MoneySnapshot } from '../../data/money-store';
import { homeCurrencyOf } from '../../money/use-money-format';
import { goalViews, occasionViews } from '../plan/plan-view';
import { insightInputOf, previousCycleStartOf } from '../wording/insight-input';

/** Each pot with what it holds, what it needs and what goes in each month, as Ask reads it. */
function askPots(snap: MoneySnapshot): AskPot[] {
  const monthly = new Map<string, number>();
  for (const view of goalViews(snap)) monthly.set(view.pot.id, view.plan.monthly);
  for (const view of occasionViews(snap)) monthly.set(view.pot.id, view.monthly);
  return snap.pots.map((pot) => ({
    name: pot.name,
    goal: pot.goal,
    saved: snap.potSaved[pot.id] ?? 0,
    monthly: pot.paused ? 0 : (monthly.get(pot.id) ?? 0),
  }));
}

/**
 * What an answer is worked out from: today's one number, the days left, payday, Future you and
 * the pots, all read from the store as it stands now. Null before the month is set up.
 */
export function askContextOf(snap: MoneySnapshot): AskContext | null {
  const input = dailyInputOf(snap);
  const day = dayOf(snap);
  if (input === null || day === null || snap.plan === null) return null;
  return {
    today: snap.today,
    day,
    daysLeft: snap.cycle.daysLeft,
    payday: snap.cycle.payday,
    futureYou: snap.plan.futureYou,
    futureYouThisCycle: cycleFutureYou(input),
    share: input.share ?? 1,
    pots: askPots(snap),
    currency: homeCurrencyOf(snap.plan),
  };
}

/**
 * The user's own records an answer may read: this cycle's spends and the waiting ones from the
 * store, plus the previous cycle's (`earlier`), which the store does not hold.
 */
export function askLedgerOf(snap: MoneySnapshot, earlier: readonly SpendRow[]): AskLedger {
  const input = insightInputOf(snap, dayOf(snap) ?? ZERO_DAY, earlier);
  const previousCycleStart = previousCycleStartOf(snap);
  return {
    cycleStart: snap.cycle.start,
    previousCycleStart,
    since: previousCycleStart ?? snap.cycle.start,
    spends: input.spends,
    closed: input.closed,
    categories: snap.categories.map((c) => ({ id: c.id, name: c.name })),
    notDaily: input.notDaily,
    bills: input.bills,
    pots: input.pots,
  };
}

/** Only the ledger's spends and records are read; a day before set-up has nothing to count. */
const ZERO_DAY = {
  startFree: 0,
  line: 0,
  spent: 0,
  free: 0,
  safe: 0,
  tomorrow: 0,
  replan: false,
  overspent: false,
} as const;
