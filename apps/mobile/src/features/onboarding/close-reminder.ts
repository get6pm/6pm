import { closeRemindersAhead, DEFAULT_CLOSE_AT, type LocalDate } from '@6pm/domain';
import { t, type Language } from '@6pm/i18n';

/**
 * Loaded on first use: a build without the notifications module still opens, and onboarding then
 * simply goes on without a reminder.
 */
const notifications = () => import('expo-notifications');

/** Every close reminder's id: this, then the money day it asks to close ('close-reminder:2026-10-16'). */
export const CLOSE_REMINDER_PREFIX = 'close-reminder:';

/** The one repeating daily reminder builds before this one scheduled; cancelled on every rebuild. */
const REPEATING_REMINDER_ID = 'close-reminder';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Whether a notification is a close reminder, either kind. */
export function isCloseReminder(identifier: string): boolean {
  return identifier === REPEATING_REMINDER_ID || identifier.startsWith(CLOSE_REMINDER_PREFIX);
}

/** The money day a close reminder asks to close, or null when its id does not name one. */
export function closeReminderDay(identifier: string): LocalDate | null {
  if (!identifier.startsWith(CLOSE_REMINDER_PREFIX)) return null;
  const day = identifier.slice(CLOSE_REMINDER_PREFIX.length);
  return DAY.test(day) ? day : null;
}

/** "It's six. Time to close your day." at 18:00, "It's 19:30. …" at any other close time. */
export function closeReminderText(language: Language, closeAt: string): string {
  return closeAt === DEFAULT_CLOSE_AT
    ? t(language, 'reminder.close.six')
    : t(language, 'reminder.close.at', { time: closeAt });
}

/**
 * Asks iOS for permission to send the daily close reminder. Shows the system alert the first time;
 * afterwards returns what the user already chose without asking again.
 */
export async function askForReminders(): Promise<boolean> {
  const Notifications = await notifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const answer = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return answer.granted;
}

type NotificationsModule = Awaited<ReturnType<typeof notifications>>;

async function cancelAll(Notifications: NotificationsModule): Promise<void> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const ids = new Set([REPEATING_REMINDER_ID]);
  for (const request of pending)
    if (isCloseReminder(request.identifier)) ids.add(request.identifier);
  await Promise.all([...ids].map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

/** Rebuilds run one after another, so two at once never leave a mix of both. */
let rebuilding: Promise<void> = Promise.resolve();

/**
 * Schedules the close reminder once on each of the coming money days, at the close time, leaving
 * out days already closed. Each call replaces the whole set, so it is rebuilt whenever a day closes,
 * the close time or the language changes, and when the app comes back.
 */
export function scheduleCloseReminder(
  language: Language,
  closeAt: string,
  closedDays: Iterable<LocalDate> = [],
): Promise<void> {
  const closed = new Set(closedDays);
  const run = rebuilding.then(async () => {
    const Notifications = await notifications();
    await cancelAll(Notifications);
    const body = closeReminderText(language, closeAt);
    for (const slot of closeRemindersAhead(new Date(), closeAt, closed)) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${CLOSE_REMINDER_PREFIX}${slot.day}`,
        content: { body, sound: 'default' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: slot.at },
      });
    }
  });
  rebuilding = run.catch(() => undefined);
  return run;
}

/** No more reminders: after Delete all data, until onboarding sets one again. */
export function cancelCloseReminder(): Promise<void> {
  const run = rebuilding.then(async () => cancelAll(await notifications()));
  rebuilding = run.catch(() => undefined);
  return run;
}

/**
 * While 6pm is open, the reminder is not shown as a banner over the app: `onArrive` gets it
 * instead, so the companion can say it in the island. When `quiet` says so (the day it asks about
 * is closed, or the close is already open), it is neither shown nor said. Returns the unsubscribe.
 */
export function takeOverRemindersWhileOpen(
  onArrive: () => void,
  quiet: (identifier: string) => boolean,
): () => void {
  let removed = false;
  let remove = () => {
    removed = true;
  };
  void notifications()
    .then((Notifications) => {
      if (removed) return;
      Notifications.setNotificationHandler({
        handleNotification: (n) => {
          const { identifier } = n.request;
          const ours = isCloseReminder(identifier);
          const silent = ours && quiet(identifier);
          if (ours && !silent) onArrive();
          return Promise.resolve({
            shouldShowBanner: !ours,
            shouldShowList: !silent,
            shouldPlaySound: !ours,
            shouldSetBadge: false,
          });
        },
      });
      remove = () => Notifications.setNotificationHandler(null);
    })
    .catch(() => undefined);
  return () => remove();
}
