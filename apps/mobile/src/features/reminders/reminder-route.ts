import type { MoneySnapshot } from '../../data/money-store';
import { CLOSE_REMINDER_ID } from '../onboarding/close-reminder';

/**
 * Where tapping a notification leads. The close reminder opens the close when there is a plan and
 * today has not been closed yet; anything else (another notification, a day already closed, a
 * phone not yet set up) just opens the app where it was.
 */
export function routeForTappedNotification(
  identifier: string,
  snapshot: Pick<MoneySnapshot, 'plan' | 'today' | 'closedDays'>,
): '/close' | null {
  if (identifier !== CLOSE_REMINDER_ID) return null;
  if (snapshot.plan === null) return null;
  return snapshot.closedDays.some((closed) => closed.day === snapshot.today) ? null : '/close';
}
