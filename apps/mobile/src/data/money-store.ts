import {
  ceilToFiftyThousand,
  dailyNumber,
  joinedShare,
  payCycleOn,
  type BillRow,
  type CategoryRow,
  type ClosedDayRow,
  type DailyNumber,
  type LocalDate,
  type PayCycle,
  type PotRow,
  type SpendRow,
  sumCounted,
} from '@6pm/domain';

import { openMoneyTables, type MoneyTables } from './money-tables';
import { readPlan, type PlanSettings } from './plan-settings';
import type { SqlDatabase } from './table';

/** Everything the screens read, as one immutable snapshot of the phone's money database. */
export interface MoneySnapshot {
  readonly today: LocalDate;
  /** Null until onboarding has set the month up. */
  readonly plan: PlanSettings | null;
  readonly cycle: PayCycle;
  readonly categories: readonly CategoryRow[];
  /** This pay cycle's spends up to today, newest first, deleted ones left out. */
  readonly cycleSpends: readonly SpendRow[];
  readonly bills: readonly BillRow[];
  readonly pots: readonly PotRow[];
  /** Saved per pot, from its moves. */
  readonly potSaved: Readonly<Record<string, number>>;
  readonly topUpsThisCycle: number;
  readonly closedDays: readonly ClosedDayRow[];
}

export interface MoneyStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): MoneySnapshot;
  /** Re-reads the database for `today` (on launch, at midnight, after the app returns). */
  load(today: LocalDate): Promise<void>;
  readonly db: SqlDatabase;
  readonly tables: MoneyTables;
  /** Replaces the snapshot after a write and tells every reader. */
  publish(next: MoneySnapshot): void;
}

function monthsBetween(from: LocalDate, toMonth: string): number {
  const [fy = 0, fm = 0] = from.split('-').map(Number);
  const [ty = 0, tm = 0] = toMonth.split('-').map(Number);
  return Math.max(1, (ty - fy) * 12 + (tm - fm));
}

/** What each occasion pot sets aside a month: what is left, spread over the months to its date. */
export function potMonthly(pot: PotRow, saved: number, today: LocalDate): number {
  if (pot.paused || pot.kind !== 'occasion' || pot.neededBy === null) return 0;
  const left = Math.max(0, pot.goal - saved);
  return left === 0 ? 0 : ceilToFiftyThousand(left / monthsBetween(today, pot.neededBy));
}

/** The one number for the snapshot's today. */
export function dayOf(snapshot: MoneySnapshot): DailyNumber | null {
  const { plan, today } = snapshot;
  if (plan === null) return null;
  const notDaily = new Set(snapshot.categories.filter((c) => !c.countsDaily).map((c) => c.id));
  const counted = (s: SpendRow) => ({
    amount: s.amount,
    category: s.categoryId,
    status: s.status,
    forWork: s.forWork,
  });
  const spentBefore = sumCounted(
    snapshot.cycleSpends.filter((s) => s.day < today).map(counted),
    notDaily,
  );
  const bills = snapshot.bills.reduce((sum, b) => sum + b.amount, 0);
  const occasions = snapshot.pots.reduce(
    (sum, p) => sum + potMonthly(p, snapshot.potSaved[p.id] ?? 0, today),
    0,
  );
  return dailyNumber({
    plan: {
      income: plan.income,
      bills,
      futureYou: plan.futureYou,
      occasions,
      topUps: snapshot.topUpsThisCycle,
    },
    spentBefore,
    today: snapshot.cycleSpends.filter((s) => s.day === today).map(counted),
    notDaily,
    daysLeft: snapshot.cycle.daysLeft,
    share: joinedShare(snapshot.cycle, plan.startedOn ?? null),
  });
}

export function createMoneyStore(db: SqlDatabase, today: LocalDate): MoneyStore {
  const tables = openMoneyTables(db);
  const listeners = new Set<() => void>();
  let snapshot: MoneySnapshot = {
    today,
    plan: null,
    cycle: payCycleOn(today, { kind: 'lastDay' }),
    categories: [],
    cycleSpends: [],
    bills: [],
    pots: [],
    potSaved: {},
    topUpsThisCycle: 0,
    closedDays: [],
  };

  const publish = (next: MoneySnapshot) => {
    snapshot = next;
    for (const listener of listeners) listener();
  };

  const load = async (day: LocalDate) => {
    const plan = await readPlan(db);
    const cycle = payCycleOn(day, plan?.payday ?? { kind: 'lastDay' });
    const [categories, cycleSpends, bills, pots, moves, closedDays] = await Promise.all([
      tables.categories.select('WHERE archived_at IS NULL ORDER BY sort', []),
      tables.spends.select("WHERE day >= ? AND day <= ? AND status != 'deleted' ORDER BY at DESC", [
        cycle.start,
        day,
      ]),
      tables.bills.select('WHERE archived_at IS NULL ORDER BY sort', []),
      tables.pots.select('WHERE archived_at IS NULL ORDER BY created_at', []),
      db.getAllAsync<{ pot_id: string; amount: number; kind: string; cycle: string }>(
        'SELECT pot_id, amount, kind, cycle FROM pot_moves',
        [],
      ),
      tables.closedDays.select('WHERE day >= ? ORDER BY day', [cycle.start]),
    ]);
    const potSaved: Record<string, number> = {};
    let topUpsThisCycle = 0;
    for (const move of moves) {
      potSaved[move.pot_id] = (potSaved[move.pot_id] ?? 0) + move.amount;
      if (move.kind === 'topUp' && move.cycle === cycle.start) topUpsThisCycle += move.amount;
    }
    publish({
      today: day,
      plan,
      cycle,
      categories,
      cycleSpends,
      bills,
      pots,
      potSaved,
      topUpsThisCycle,
      closedDays,
    });
  };

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    load,
    db,
    tables,
    publish,
  };
}
