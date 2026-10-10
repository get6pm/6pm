import {
  addDays,
  closeMoment,
  formatVnd,
  needsReview,
  startOfWeek,
  type CategoryRow,
  type CloseMoment,
  type LocalDate,
  type SpendRow,
} from '@6pm/domain';

import { isSymbolName } from '../../ui/icons/symbol';
import type { MoneySnapshot } from '../../data/money-store';
import { merchantIcon } from './merchant-icon';
import type { SpendRowView } from './spend-row';

export interface WeekDay {
  readonly day: LocalDate;
  readonly closed: boolean;
  readonly isToday: boolean;
  readonly future: boolean;
}

export interface TodayView {
  readonly moment: CloseMoment;
  readonly queue: readonly SpendRow[];
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
      amount: formatVnd(s.amount),
      icon: merchantIcon(s.merchant, categoryIcon),
      hue: category?.hue ?? 80,
      tag: labels.tag(s),
      reviewable: needsReview(s),
      skipped: s.status === 'skipped',
      first: i === 0,
    };
  });
}

/** What Today shows, read from the store: the close moment, the review queue, rows and the week. */
export function todayView(
  snap: MoneySnapshot,
  hour: number,
  spent: number,
  labels: Labels,
): TodayView {
  const { today } = snap;
  const closed = snap.closedDays.some((d) => d.day === today);
  const moment = closeMoment(hour, snap.plan?.closeAt ?? '18:00', closed);
  const todays = snap.cycleSpends.filter((s) => s.day === today);

  const rows = toRowViews(todays, snap.categories, labels);

  const monday = startOfWeek(today);
  const closedDays = new Set(snap.closedDays.map((d) => d.day));
  const week = Array.from({ length: 7 }, (_, i): WeekDay => {
    const day = addDays(monday, i);
    return { day, closed: closedDays.has(day), isToday: day === today, future: day > today };
  });
  const monthPrefix = today.slice(0, 7);
  const elapsed = Number(today.slice(8, 10)) - (closed ? 0 : 1);

  return {
    moment,
    queue: todays.filter(needsReview),
    rows,
    spentLabel: formatVnd(spent),
    week,
    closedThisMonth: snap.closedDays.filter((d) => d.day.startsWith(monthPrefix)).length,
    daysThisMonth: Math.max(1, elapsed),
  };
}
