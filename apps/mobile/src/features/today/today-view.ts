import {
  addDays,
  closeMoment,
  foreignAmountText,
  needsReview,
  startOfWeek,
  type CategoryRow,
  type CloseMoment,
  type LocalDate,
  type MoneyFormat,
  type SpendRow,
} from '@6pm/domain';

import { isSymbolName } from '../../ui/icons/symbol';
import { waitingOf, type MoneySnapshot } from '../../data/money-store';
import { merchantIcon } from './merchant-icon';
import type { SpendRowView } from './spend-row';

export interface WeekDay {
  readonly day: LocalDate;
  readonly closed: boolean;
  readonly isToday: boolean;
  readonly future: boolean;
  /** A past day since 6pm began that was never closed: its dot opens the catch-up sheet. */
  readonly missed: boolean;
}

export interface TodayView {
  readonly moment: CloseMoment;
  /** Everything waiting for a yes: today's, and earlier days' that were never settled. */
  readonly queue: readonly SpendRow[];
  /** When today was closed, if it was: the stamp on tonight's card. */
  readonly closedAt: string | null;
  readonly rows: readonly SpendRowView[];
  readonly spentLabel: string;
  readonly week: readonly WeekDay[];
  readonly closedThisMonth: number;
  readonly daysThisMonth: number;
}

export type Labels = {
  readonly source: (source: SpendRow['source']) => string;
  readonly tag: (row: SpendRow) => string | null;
  readonly time: (iso: string) => string;
  /** Writes amounts in the home currency. */
  readonly money: Pick<MoneyFormat, 'full'>;
};

/** Display rows for a list of spends: icon, tint, "08:15 · Drinks · Shared receipt", tag. */
export function toRowViews(
  spends: readonly SpendRow[],
  categoryRows: readonly CategoryRow[],
  labels: Labels,
  withCategory = true,
): SpendRowView[] {
  const categories = new Map(categoryRows.map((c) => [c.id, c]));
  return spends.map((s, i): SpendRowView => {
    const category = categories.get(s.categoryId);
    const categoryIcon = category && isSymbolName(category.icon) ? category.icon : 'payments';
    return {
      id: s.id,
      name: s.merchant,
      meta: [
        labels.time(s.at),
        withCategory ? (category?.name ?? '') : null,
        labels.source(s.source),
      ]
        .filter((part) => part !== null)
        .join(' · '),
      amount: labels.money.full(s.amount),
      foreign: s.foreignAmount
        ? {
            printed: foreignAmountText(s.foreignAmount),
            inHome: s.foreignAmount.rate > 0 && s.amount > 0 ? labels.money.full(s.amount) : null,
          }
        : null,
      icon: merchantIcon(s.merchant, categoryIcon),
      hue: category?.hue ?? 80,
      tag: labels.tag(s),
      reviewable: needsReview(s),
      skipped: s.status === 'skipped',
      first: i === 0,
    };
  });
}

/**
 * What Today shows, read from the store: the close moment, the review queue, rows and the week.
 * `closeHour` is the hour on the money day's clock, so after midnight tonight's close is still late.
 */
export function todayView(
  snap: MoneySnapshot,
  closeHour: number,
  spent: number,
  labels: Labels,
): TodayView {
  const { today } = snap;
  const closedRow = snap.closedDays.find((d) => d.day === today);
  const closed = closedRow !== undefined;
  const moment = closeMoment(closeHour, snap.plan?.closeAt ?? '18:00', closed);
  const startedOn = snap.plan?.startedOn ?? null;
  const todays = snap.cycleSpends.filter((s) => s.day === today);

  const rows = toRowViews(todays, snap.categories, labels);

  const monday = startOfWeek(today);
  const closedDays = new Set(snap.closedDays.map((d) => d.day));
  const week = Array.from({ length: 7 }, (_, i): WeekDay => {
    const day = addDays(monday, i);
    const isClosed = closedDays.has(day);
    return {
      day,
      closed: isClosed,
      isToday: day === today,
      future: day > today,
      missed: !isClosed && day < today && startedOn !== null && day >= startedOn,
    };
  });
  const monthPrefix = today.slice(0, 7);
  const elapsed = Number(today.slice(8, 10)) - (closed ? 0 : 1);

  return {
    moment,
    queue: waitingOf(snap),
    closedAt: closedRow?.closedAt ?? null,
    rows,
    spentLabel: labels.money.full(spent),
    week,
    closedThisMonth: snap.closedDays.filter((d) => d.day.startsWith(monthPrefix)).length,
    daysThisMonth: Math.max(1, elapsed),
  };
}
