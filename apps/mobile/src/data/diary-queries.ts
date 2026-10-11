import * as Sentry from '@sentry/react-native';
import { useEffect, useState } from 'react';

import {
  countsTowardDay,
  cycleMonth,
  localDateOf,
  monthEnd,
  monthOf,
  payCycleOn,
  potTotals,
  type ClosedDayRow,
  type DailyNumber,
  type DiarySpend,
  type LocalDate,
  type MonthKey,
  type MonthTotal,
  type Payday,
  type SpendRow,
} from '@6pm/domain';

import { useMoneySelector, useMoneyStore } from './money-provider';
import { dayOf, type MoneySnapshot, type MoneyStore } from './money-store';
import { readPotMoves } from './pot-moves';

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

interface GoalMoveRow {
  readonly kind: string;
  readonly amount: number;
  readonly cycle: string;
  readonly at: string;
}

/**
 * What went to Future you in a calendar month, and everything there by its end. A pay cycle's
 * set-aside belongs to the month most of the cycle lies in; a top-up to the month it was made.
 */
export function futureYouOfMonth(
  moves: readonly GoalMoveRow[],
  month: MonthKey,
  payday: Payday,
): { added: number; total: number } {
  let added = 0;
  let total = 0;
  for (const move of moves) {
    const filed =
      move.kind === 'setAside'
        ? cycleMonth(payCycleOn(move.cycle, payday))
        : monthOf(localDateOf(new Date(move.at)));
    if (filed > month) continue;
    total += move.amount;
    if (filed === month && move.kind !== 'spent') added += move.amount;
  }
  return { added, total };
}

async function readFutureYou(
  store: MoneyStore,
  month: MonthKey,
  payday: Payday,
): Promise<{ added: number; total: number }> {
  const rows = await store.db.getAllAsync<GoalMoveRow>(
    `SELECT m.kind AS kind, m.amount AS amount, m.cycle AS cycle, m.at AS at
     FROM pot_moves m JOIN pots p ON p.id = m.pot_id
     WHERE p.kind = 'goal' AND p.archived_at IS NULL`,
    [],
  );
  return futureYouOfMonth(rows, month, payday);
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

export function notDailyOf(snap: Pick<MoneySnapshot, 'categories'>): ReadonlySet<string> {
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
  const [spends, moves] = await Promise.all([
    readSpendsBetween(store, cycle.start, day),
    readPotMoves(store.db),
  ]);
  // The day's own cycle: what its pots set aside and what was topped up in it, not today's.
  const totals = potTotals(moves, new Set(snap.pots.map((p) => p.id)), cycle.start);
  return dayOf({
    ...snap,
    today: day,
    cycle,
    cycleSpends: spends.reverse(),
    topUpsThisCycle: totals.topUps,
    setAsideThisCycle: totals.setAside,
  });
}

/**
 * What the Diary tab reads beyond the snapshot, which already holds this month's and this week's
 * closed days: the week's spends, the first day 6pm has anything for, and the totals per month.
 */
export interface DiaryData {
  readonly weekSpends: readonly SpendRow[];
  readonly since: LocalDate | null;
  readonly allClosed: number;
  readonly months: readonly MonthTotal[];
}

export async function readDiary(
  store: MoneyStore,
  week: { readonly from: LocalDate; readonly to: LocalDate },
): Promise<DiaryData> {
  const [weekSpends, since, months] = await Promise.all([
    readSpendsBetween(store, week.from, week.to),
    readFirstDay(store),
    readMonthTotals(store),
  ]);
  const allClosed = months.reduce((sum, m) => sum + m.closed, 0);
  return { weekSpends, since, allClosed, months };
}

/**
 * One day's receipt: the kept spends that count toward the day, oldest first, and its number. A
 * category set to not count, and a spend sent to Claim back, are not in the total, so they are not
 * lines: the lines add up to the total.
 */
export async function readDayReceipt(
  store: MoneyStore,
  day: LocalDate,
  notDaily: ReadonlySet<string>,
): Promise<{ readonly day: LocalDate; readonly spends: readonly SpendRow[]; readonly no: number }> {
  const [spends, no] = await Promise.all([
    readSpendsBetween(store, day, day),
    readReceiptNumber(store, day),
  ]);
  const lines = spends.filter(
    (s) =>
      s.status === 'kept' &&
      countsTowardDay(
        { amount: s.amount, category: s.categoryId, status: s.status, forWork: s.forWork },
        notDaily,
      ),
  );
  return { day, spends: lines, no };
}

/** A month's money diary: its closed days, spends and what went to Future you. */
export async function readMonthDiary(store: MoneyStore, month: MonthKey, payday: Payday) {
  const from = `${month}-01`;
  const to = monthEnd(month);
  const [closed, spends, futureYou, months] = await Promise.all([
    readClosedBetween(store, from, to),
    readSpendsBetween(store, from, to),
    readFutureYou(store, month, payday),
    readMonthTotals(store),
  ]);
  const no = months.filter((m) => m.month <= month).length;
  return { closed, spends, futureYou, no };
}

const whole = (snapshot: MoneySnapshot) => snapshot;
const nothing = () => null;

/**
 * Runs a read against the store and runs it again when `watch` changes, so the Diary follows every
 * close and edit without re-reading for writes it does not show. With no `watch` it follows every
 * publish. `read` should be stable (memoised on its inputs). While a new read is in flight the
 * last result stays on screen: no blank frames. A read that fails leaves the last result in place
 * and is reported.
 */
export function useStoreQuery<T>(
  read: (store: MoneyStore) => Promise<T>,
  watch?: unknown,
): T | null {
  const store = useMoneyStore();
  // With no `watch`, follow every publish; with one, the snapshot is not subscribed to at all.
  const snapshot = useMoneySelector(watch === undefined ? whole : nothing);
  const trigger = watch ?? snapshot;
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    let live = true;
    read(store).then(
      (next) => {
        if (live) setValue(next);
      },
      (error: unknown) => Sentry.captureException(error),
    );
    return () => {
      live = false;
    };
  }, [store, trigger, read]);
  return value;
}
