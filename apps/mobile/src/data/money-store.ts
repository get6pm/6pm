import {
  dailyNumber,
  joinedShare,
  occasionsOf,
  payCycleOn,
  potTotals,
  type BillRow,
  type CategoryRow,
  type ClosedDayRow,
  type DailyNumber,
  type DailyNumberInput,
  type LocalDate,
  type PayCycle,
  type PotRow,
  type SpendRow,
  startOfWeek,
  sumCounted,
} from '@6pm/domain';

import { openMoneyTables, type MoneyTables } from './money-tables';
import { readPlan, type PlanSettings } from './plan-settings';
import { readPotMoves, recordDueSetAsides } from './pot-moves';
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
  /** What each pot sets aside this pay cycle, recorded when the cycle began. */
  readonly setAsideThisCycle: Readonly<Record<string, number>>;
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

/** What the daily number is worked out from, for the snapshot's today. */
export function dailyInputOf(snapshot: MoneySnapshot): DailyNumberInput | null {
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
  const occasions = occasionsOf(snapshot.pots, snapshot.setAsideThisCycle);
  return {
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
  };
}

/** The one number for the snapshot's today. */
export function dayOf(snapshot: MoneySnapshot): DailyNumber | null {
  const input = dailyInputOf(snapshot);
  return input === null ? null : dailyNumber(input);
}

/**
 * How far back closed days are loaded: the pay cycle, and also this week and this calendar month,
 * which the week strip, the month dots and "closed X of Y days" read even when payday sits in the
 * middle of them.
 */
function closedSince(day: LocalDate, cycleStart: LocalDate): LocalDate {
  const monthStart = `${day.slice(0, 8)}01`;
  return [cycleStart, monthStart, startOfWeek(day)].reduce((a, b) => (a < b ? a : b));
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
    setAsideThisCycle: {},
    closedDays: [],
  };

  const publish = (next: MoneySnapshot) => {
    snapshot = next;
    for (const listener of listeners) listener();
  };

  const load = async (day: LocalDate) => {
    const plan = await readPlan(db);
    const cycle = payCycleOn(day, plan?.payday ?? { kind: 'lastDay' });
    const [categories, cycleSpends, bills, pots, recorded, closedDays] = await Promise.all([
      tables.categories.select('WHERE archived_at IS NULL ORDER BY sort', []),
      tables.spends.select("WHERE day >= ? AND day <= ? AND status != 'deleted' ORDER BY at DESC", [
        cycle.start,
        day,
      ]),
      tables.bills.select('WHERE archived_at IS NULL ORDER BY sort', []),
      tables.pots.select('WHERE archived_at IS NULL ORDER BY created_at', []),
      readPotMoves(db),
      tables.closedDays.select('WHERE day >= ? ORDER BY day', [closedSince(day, cycle.start)]),
    ]);
    // Each pay cycle puts the month's set-aside into every pot, once; a launch after missed
    // days or cycles catches up here before anything is counted.
    const caughtUp = plan
      ? await recordDueSetAsides(db, {
          pots,
          moves: recorded,
          futureYou: plan.futureYou,
          payday: plan.payday,
          today: day,
        })
      : [];
    const {
      saved: potSaved,
      setAside,
      topUps,
    } = potTotals([...recorded, ...caughtUp], new Set(pots.map((p) => p.id)), cycle.start);
    publish({
      today: day,
      plan,
      cycle,
      categories,
      cycleSpends,
      bills,
      pots,
      potSaved,
      topUpsThisCycle: topUps,
      setAsideThisCycle: setAside,
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
