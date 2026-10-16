import { moneyDayOf, type LocalDate } from '@6pm/domain';

import type { MoneySnapshot } from '../../data/money-store';
import { closeReminderDay, isCloseReminder } from '../onboarding/close-reminder';

type Snapshot = Pick<MoneySnapshot, 'plan' | 'today' | 'closedDays'>;

const isClosed = (snapshot: Pick<MoneySnapshot, 'closedDays'>, day: LocalDate) =>
  snapshot.closedDays.some((closed) => closed.day === day);

/**
 * When a notification was delivered. iOS reports seconds since 1970 and Android milliseconds; any
 * delivery in this century reads as more than 10¹¹ only in milliseconds.
 */
export function deliveredAtOf(date: number): Date {
  return new Date(date < 1e11 ? date * 1000 : date);
}

/** The money day a close reminder asks to close: named in its id, or the day it was delivered. */
function reminderDayOf(identifier: string, deliveredAt: Date): LocalDate {
  return closeReminderDay(identifier) ?? moneyDayOf(deliveredAt);
}

/**
 * Where tapping a notification leads. Tonight's close reminder opens the close when there is a
 * plan and today has not been closed yet. A reminder about an earlier day (left in Notification
 * Centre and tapped the morning after) opens that missed day while it is still open, never today's
 * close. Anything else (another notification, a day already closed, a phone not yet set up) just
 * opens the app where it was.
 */
export function routeForTappedNotification(
  identifier: string,
  deliveredAt: Date,
  snapshot: Snapshot,
): '/close' | `/missed-day?day=${string}` | null {
  if (!isCloseReminder(identifier) || snapshot.plan === null) return null;
  const day = reminderDayOf(identifier, deliveredAt);
  if (day < snapshot.today) return isClosed(snapshot, day) ? null : `/missed-day?day=${day}`;
  return isClosed(snapshot, snapshot.today) ? null : '/close';
}

/**
 * Whether a close reminder arriving while 6pm is open says nothing: the day it asks about is
 * already closed, or the close is open on screen.
 */
export function closeReminderStaysQuiet(
  identifier: string,
  snapshot: Pick<MoneySnapshot, 'today' | 'closedDays'>,
  pathname: string,
): boolean {
  if (pathname === '/close') return true;
  return isClosed(snapshot, closeReminderDay(identifier) ?? snapshot.today);
}
