import {
  currencyOf,
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
  needsReview,
  type SpendRow,
  startOfWeek,
  sumCounted,
} from '@6pm/domain';

import { createQueue } from './store-queue';
import { openMoneyTables, type MoneyTables } from './money-tables';
import { planCurrencyCode, readPlan, type PlanSettings } from './plan-settings';
import { readPotMoves, recordDueSetAsides } from './pot-moves';
import type { SqlDatabase } from './table';
import { togetherTopUps } from './together-moves';

/** Everything the screens read, as one immutable snapshot of the phone's money database. */
export interface MoneySnapshot {
  readonly today: LocalDate;
  /** Null until onboarding has set the month up. */
  readonly plan: PlanSettings | null;
  readonly cycle: PayCycle;
  readonly categories: readonly CategoryRow[];
  /** This pay cycle's spends up to today, newest first, deleted ones left out. */
  readonly cycleSpends: readonly SpendRow[];
  /**
   * Spends from before this pay cycle began that were caught or pending when it was read, newest
   * first. They already counted in the cycle they were caught in, so they are not in
   * `cycleSpends` and never lower this cycle's number (counting them again would take the same
   * money out twice); they only wait for a yes in the close and the Inbox. One answered since
   * stays here, with its new status, until the next read; `waitingOf` lists only those still waiting.
   */
  readonly waitingBefore: readonly SpendRow[];
  readonly bills: readonly BillRow[];
  readonly pots: readonly PotRow[];
  /** Saved per pot, from its moves. */
  readonly potSaved: Readonly<Record<string, number>>;
  /** Top-ups this cycle: the person's own pots, and what they put into shared pots. */
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
  /** Runs `task` after every earlier load and write has finished, and before any later one. */
  readonly exclusive: <T>(task: () => Promise<T>) => Promise<T>;
  /** `load` for code already running inside `exclusive` (which would otherwise wait for itself). */
  loadInTurn(today: LocalDate): Promise<void>;
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
    currency: currencyOf(planCurrencyCode(plan)),
  };
}

/** Everything waiting for a yes, newest first: this cycle's, and what is left from before it. */
export function waitingOf(snapshot: MoneySnapshot): SpendRow[] {
  return [...snapshot.cycleSpends, ...snapshot.waitingBefore]
    .filter(needsReview)
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

/** A spend the screens hold, from this cycle or waiting from before it. */
export function findSpend(snapshot: MoneySnapshot, id: string): SpendRow | undefined {
  return (
    snapshot.cycleSpends.find((s) => s.id === id) ?? snapshot.waitingBefore.find((s) => s.id === id)
  );
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
    waitingBefore: [],
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

  const exclusive = createQueue();

  const loadNow = async (day: LocalDate) => {
    const plan = await readPlan(db);
    const cycle = payCycleOn(day, plan?.payday ?? { kind: 'lastDay' });
    const [categories, cycleSpends, waitingBefore, bills, pots, recorded, closedDays, together] =
      await Promise.all([
        tables.categories.select('WHERE archived_at IS NULL ORDER BY sort', []),
        tables.spends.select(
          "WHERE day >= ? AND day <= ? AND status != 'deleted' ORDER BY at DESC",
          [cycle.start, day],
        ),
        tables.spends.select("WHERE day < ? AND status IN ('caught', 'pending') ORDER BY at DESC", [
          cycle.start,
        ]),
        tables.bills.select('WHERE archived_at IS NULL ORDER BY sort', []),
        tables.pots.select('WHERE archived_at IS NULL ORDER BY created_at', []),
        readPotMoves(db),
        tables.closedDays.select('WHERE day >= ? ORDER BY day', [closedSince(day, cycle.start)]),
        togetherTopUps(db, cycle.start),
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
          currency: currencyOf(planCurrencyCode(plan)),
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
      waitingBefore,
      bills,
      pots,
      potSaved,
      topUpsThisCycle: topUps + together,
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
    load: (day) => exclusive(() => loadNow(day)),
    exclusive,
    loadInTurn: loadNow,
    db,
    tables,
    publish,
  };
}
