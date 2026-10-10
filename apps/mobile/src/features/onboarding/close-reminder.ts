import { DEFAULT_CLOSE_AT, hoursOf } from '@6pm/domain';
import { t, type Language } from '@6pm/i18n';

/**
 * Loaded on first use: a build without the notifications module still opens, and onboarding then
 * simply goes on without a reminder.
 */
const notifications = () => import('expo-notifications');

/** One daily reminder; scheduling again under the same id replaces it. */
export const CLOSE_REMINDER_ID = 'close-reminder';

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

/** Schedules (or moves) the reminder to fire every day at the close time. */
export async function scheduleCloseReminder(language: Language, closeAt: string): Promise<void> {
  const hours = hoursOf(closeAt);
  const hour = Math.floor(hours);
  const minute = Math.round((hours - hour) * 60);
  const Notifications = await notifications();
  await Notifications.cancelScheduledNotificationAsync(CLOSE_REMINDER_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: CLOSE_REMINDER_ID,
    content: { body: closeReminderText(language, closeAt), sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

/** No more reminders: after Delete all data, until onboarding sets one again. */
export async function cancelCloseReminder(): Promise<void> {
  const Notifications = await notifications();
  await Notifications.cancelScheduledNotificationAsync(CLOSE_REMINDER_ID);
}

/**
 * While 6pm is open, the reminder is not shown as a banner over the app: `onArrive` gets it
 * instead, so the companion can say it in the island. Returns the unsubscribe.
 */
export function takeOverRemindersWhileOpen(onArrive: () => void): () => void {
  let removed = false;
  let remove = () => {
    removed = true;
  };
  void notifications()
    .then((Notifications) => {
      if (removed) return;
      Notifications.setNotificationHandler({
        handleNotification: (n) => {
          const ours = n.request.identifier === CLOSE_REMINDER_ID;
          if (ours) onArrive();
          return Promise.resolve({
            shouldShowBanner: !ours,
            shouldShowList: true,
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
