import { useEffect, useState } from 'react';

import {
  monthEnd,
  payCycleOn,
  type ClosedDayRow,
  type DailyNumber,
  type DiarySpend,
  type LocalDate,
  type MonthKey,
  type MonthTotal,
  type SpendRow,
} from '@6pm/domain';

import { useMoney, useMoneyStore } from './money-provider';
import { dayOf, type MoneySnapshot, type MoneyStore } from './money-store';

/**
 * Read-only queries the Diary needs beyond the current pay cycle the snapshot holds: closed days
 * and spends of any month, totals per month, and what a past day's line was.
 */

export function readClosedBetween(
  store: MoneyStore,
  from: LocalDate,
  to: LocalDate,
): Promise<ClosedDayRow[]> {
  return store.tables.closedDays.select('WHERE day >= ? AND day <= ? ORDER BY day', [from, to]);
}

/** Every spend filed between two days (inclusive), deleted ones left out, oldest first. */
export function readSpendsBetween(
  store: MoneyStore,
  from: LocalDate,
  to: LocalDate,
): Promise<SpendRow[]> {
  return store.tables.spends.select(
    "WHERE day >= ? AND day <= ? AND status != 'deleted' ORDER BY at",
    [from, to],
  );
}

/** The first day 6pm has anything for: a spend or a closed day. Null on a fresh install. */
async function readFirstDay(store: MoneyStore): Promise<LocalDate | null> {
  const rows = await store.db.getAllAsync<{ day: string | null }>(
    `SELECT MIN(day) AS day FROM (
       SELECT MIN(day) AS day FROM spends WHERE status != 'deleted'
       UNION ALL SELECT MIN(day) AS day FROM closed_days
     )`,
    [],
  );
  return rows[0]?.day ?? null;
}

/** Closed days, spent and lines added up per calendar month, oldest first. */
async function readMonthTotals(store: MoneyStore): Promise<MonthTotal[]> {
  return store.db.getAllAsync<MonthTotal>(
    `SELECT substr(day, 1, 7) AS month, COUNT(*) AS closed, SUM(spent) AS spent, SUM(line) AS line
     FROM closed_days GROUP BY month ORDER BY month`,
    [],
  );
}

/** How many days were closed up to and including `day`: its receipt number. */
async function readReceiptNumber(store: MoneyStore, day: LocalDate): Promise<number> {
  const rows = await store.db.getAllAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM closed_days WHERE day <= ?',
    [day],
  );
  return rows[0]?.n ?? 0;
}

/** What moved to Future you (goal pots) in a month's pay cycles, and everything there by its end. */
async function readFutureYou(
  store: MoneyStore,
  month: MonthKey,
): Promise<{ added: number; total: number }> {
  const rows = await store.db.getAllAsync<{ added: number | null; total: number | null }>(
    `SELECT
       SUM(CASE WHEN substr(m.cycle, 1, 7) = ? AND m.kind != 'spent' THEN m.amount ELSE 0 END) AS added,
       SUM(m.amount) AS total
     FROM pot_moves m JOIN pots p ON p.id = m.pot_id
     WHERE p.kind = 'goal' AND m.cycle <= ?`,
    [month, monthEnd(month)],
  );
  return { added: rows[0]?.added ?? 0, total: rows[0]?.total ?? 0 };
}

export function toDiarySpend(s: SpendRow): DiarySpend {
  return {
    day: s.day,
    merchant: s.merchant,
    amount: s.amount,
    category: s.categoryId,
    status: s.status,
    forWork: s.forWork,
  };
}

export function notDailyOf(snap: MoneySnapshot): ReadonlySet<string> {
  return new Set(snap.categories.filter((c) => !c.countsDaily).map((c) => c.id));
}

/**
 * The daily number as it stood on a past day: the same engine as today's, run over that day's pay
 * cycle up to that day. Used to file a missed day with the line it had.
 */
export async function readDayNumber(
  store: MoneyStore,
  snap: MoneySnapshot,
  day: LocalDate,
): Promise<DailyNumber | null> {
  if (snap.plan === null) return null;
  const cycle = payCycleOn(day, snap.plan.payday);
  const cycleSpends = (await readSpendsBetween(store, cycle.start, day)).reverse();
  return dayOf({
    ...snap,
    today: day,
    cycle,
    cycleSpends,
    topUpsThisCycle: cycle.start === snap.cycle.start ? snap.topUpsThisCycle : 0,
  });
}

/** Everything the Diary tab reads for this month. */
export interface DiaryData {
  readonly monthClosed: readonly ClosedDayRow[];
  readonly weekClosed: readonly ClosedDayRow[];
  readonly weekSpends: readonly SpendRow[];
  readonly since: LocalDate | null;
  readonly allClosed: number;
  readonly months: readonly MonthTotal[];
}

export async function readDiary(
  store: MoneyStore,
  month: MonthKey,
  week: { readonly from: LocalDate; readonly to: LocalDate },
): Promise<DiaryData> {
  const [monthClosed, weekClosed, weekSpends, since, months] = await Promise.all([
    readClosedBetween(store, `${month}-01`, monthEnd(month)),
    readClosedBetween(store, week.from, week.to),
    readSpendsBetween(store, week.from, week.to),
    readFirstDay(store),
    readMonthTotals(store),
  ]);
  const allClosed = months.reduce((sum, m) => sum + m.closed, 0);
  return { monthClosed, weekClosed, weekSpends, since, allClosed, months };
}

/** One day's receipt: its kept spends, oldest first, and its number. */
export async function readDayReceipt(
  store: MoneyStore,
  day: LocalDate,
): Promise<{ readonly day: LocalDate; readonly spends: readonly SpendRow[]; readonly no: number }> {
  const [spends, no] = await Promise.all([
    readSpendsBetween(store, day, day),
    readReceiptNumber(store, day),
  ]);
  return { day, spends: spends.filter((s) => s.status === 'kept' && !s.forWork), no };
}

/** A month's money diary: its closed days, spends and what went to Future you. */
export async function readMonthDiary(store: MoneyStore, month: MonthKey) {
  const from = `${month}-01`;
  const to = monthEnd(month);
  const [closed, spends, futureYou, months] = await Promise.all([
    readClosedBetween(store, from, to),
    readSpendsBetween(store, from, to),
    readFutureYou(store, month),
    readMonthTotals(store),
  ]);
  const no = months.filter((m) => m.month <= month).length;
  return { closed, spends, futureYou, no };
}

/**
 * Runs a read against the store and runs it again whenever the store publishes, so the Diary
 * follows every close and edit. `read` should be stable (memoised on its inputs). While a new read
 * is in flight the last result stays on screen: no blank frames.
 */
export function useStoreQuery<T>(read: (store: MoneyStore) => Promise<T>): T | null {
  const store = useMoneyStore();
  const snapshot = useMoney();
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    let live = true;
    void read(store).then((next) => {
      if (live) setValue(next);
    });
    return () => {
      live = false;
    };
  }, [store, snapshot, read]);
  return value;
}
