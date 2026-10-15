import { needsALook, startOfWeek, type LocalDate, type SpendRow } from '@6pm/domain';

export type InboxSection =
  /** Spends that would be wrong to confirm as they are, from any day. */
  | { readonly kind: 'look'; readonly key: string; readonly spends: readonly SpendRow[] }
  | { readonly kind: 'today'; readonly key: string; readonly spends: readonly SpendRow[] }
  | {
      readonly kind: 'earlier';
      readonly key: string;
      readonly day: LocalDate;
      /** The day was closed, so these came in after. */
      readonly closed: boolean;
      readonly spends: readonly SpendRow[];
    };

/**
 * The Inbox's sections, top to bottom: what needs a look, today's, then one per earlier day,
 * the most recent first. `waiting` is in the order the rows show (oldest first), and each
 * section keeps it. A spend that needs a look shows only there.
 */
export function inboxSections(
  waiting: readonly SpendRow[],
  today: LocalDate,
  closedDays: ReadonlySet<LocalDate>,
): InboxSection[] {
  const look = waiting.filter((s) => needsALook(s));
  const rest = waiting.filter((s) => !needsALook(s));
  const earlierDays = [...new Set(rest.filter((s) => s.day < today).map((s) => s.day))]
    .sort()
    .reverse();
  const sections: InboxSection[] = [
    { kind: 'look', key: 'look', spends: look },
    { kind: 'today', key: 'today', spends: rest.filter((s) => s.day === today) },
    ...earlierDays.map((day): InboxSection => ({
      kind: 'earlier',
      key: day,
      day,
      closed: closedDays.has(day),
      spends: rest.filter((s) => s.day === day),
    })),
  ];
  return sections.filter((section) => section.spends.length > 0);
}

/**
 * How an earlier day is named: by its weekday within this week, where the name is unique, and by
 * its date before that, where two Wednesdays would otherwise read the same.
 */
export function dayNaming(day: LocalDate, today: LocalDate): 'weekday' | 'date' {
  return day >= startOfWeek(today) ? 'weekday' : 'date';
}
