import { joinedShare, type AskContext, type AskPot } from '@6pm/domain';

import { dayOf, type MoneySnapshot } from '../../data/money-store';
import { goalViews, occasionViews } from '../plan/plan-view';

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
  const day = dayOf(snap);
  if (day === null || snap.plan === null) return null;
  return {
    today: snap.today,
    day,
    daysLeft: snap.cycle.daysLeft,
    payday: snap.cycle.payday,
    futureYou: snap.plan.futureYou,
    share: joinedShare(snap.cycle, snap.plan.startedOn ?? null),
    pots: askPots(snap),
  };
}
