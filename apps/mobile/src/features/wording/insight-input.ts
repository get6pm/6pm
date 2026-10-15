import {
  addDays,
  payCycleOn,
  type DailyNumber,
  type InsightInput,
  type InsightSpend,
  type LocalDate,
  type SpendRow,
} from '@6pm/domain';

import type { MoneySnapshot } from '../../data/money-store';
import { openMoneyTables } from '../../data/money-tables';
import type { SqlDatabase } from '../../data/table';

export function insightSpendOf(row: SpendRow): InsightSpend {
  return {
    id: row.id,
    day: row.day,
    merchant: row.merchant,
    amount: row.amount,
    category: row.categoryId,
    status: row.status,
    source: row.source,
    forWork: row.forWork,
  };
}

/**
 * Where the cycle before this one started, when the user was already counting then. A cycle they
 * joined part-way through is not a fair thing to compare against, so it is not one.
 */
export function previousCycleStartOf(snap: MoneySnapshot): LocalDate | null {
  if (snap.plan === null) return null;
  const previous = payCycleOn(addDays(snap.cycle.start, -1), snap.plan.payday).start;
  const started = snap.plan.startedOn ?? null;
  return started !== null && started > previous ? null : previous;
}

/** The previous cycle's spends, which the store does not hold: patterns compare against them. */
export async function readEarlierSpends(
  db: SqlDatabase,
  from: LocalDate,
  before: LocalDate,
): Promise<SpendRow[]> {
  return openMoneyTables(db).spends.select(
    "WHERE day >= ? AND day < ? AND status != 'deleted' ORDER BY at DESC",
    [from, before],
  );
}

/** Everything the facts read, from the store as it stands plus the previous cycle's spends. */
export function insightInputOf(
  snap: MoneySnapshot,
  day: DailyNumber,
  earlier: readonly SpendRow[],
): InsightInput {
  const seen = new Set<string>();
  const spends = [...snap.cycleSpends, ...snap.waitingBefore, ...earlier]
    .filter((row) => (seen.has(row.id) ? false : (seen.add(row.id), true)))
    .map(insightSpendOf);
  return {
    today: snap.today,
    day,
    cycle: snap.cycle,
    previousCycleStart: previousCycleStartOf(snap),
    spends,
    closed: snap.closedDays.map((d) => ({ day: d.day, spent: d.spent, line: d.line })),
    notDaily: new Set(snap.categories.filter((c) => !c.countsDaily).map((c) => c.id)),
    bills: snap.bills.map((b) => ({
      id: b.id,
      name: b.name,
      amount: b.amount,
      dueDay: b.dueDay,
      paid: b.paidCycle === snap.cycle.start,
    })),
    pots: snap.pots.map((p) => ({
      id: p.id,
      name: p.name,
      goal: p.goal,
      saved: snap.potSaved[p.id] ?? 0,
    })),
  };
}
