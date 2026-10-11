import { useSyncExternalStore } from 'react';

/**
 * Whether the close reminder can reach the user: `granted`, not asked yet (`ask`), or refused in
 * iOS Settings (`denied`, which only iOS Settings can change).
 */
export type ReminderPermission = 'granted' | 'ask' | 'denied';

export function reminderPermissionOf(status: {
  readonly granted: boolean;
  readonly canAskAgain: boolean;
}): ReminderPermission {
  if (status.granted) return 'granted';
  return status.canAskAgain ? 'ask' : 'denied';
}

// What the phone last said, shared so Settings can draw the reminder row on its first frame and
// the scheduler can react the moment the answer changes.
let known: ReminderPermission | null = null;
const listeners = new Set<() => void>();

/** Reads the permission from iOS and tells every reader when it differs from the last answer. */
export async function refreshReminderPermission(): Promise<ReminderPermission | null> {
  try {
    const Notifications = await import('expo-notifications');
    const next = reminderPermissionOf(await Notifications.getPermissionsAsync());
    if (next !== known) {
      known = next;
      for (const listener of listeners) listener();
    }
    return next;
  } catch {
    // A build without the notifications module has no reminder to ask about.
    return null;
  }
}

/** The last permission answer, or null before the first one. */
export function useReminderPermission(): ReminderPermission | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => known,
  );
}
