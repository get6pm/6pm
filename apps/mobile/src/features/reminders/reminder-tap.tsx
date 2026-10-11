import { usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useMoney } from '../../data/money-provider';
import { routeForTappedNotification } from './reminder-route';

/**
 * Tapping the close reminder opens the close, whether 6pm was running or was started by the tap.
 * Waits for the navigator, so a launch from the notification does not navigate before it exists.
 */
export function ReminderTap() {
  const router = useRouter();
  const pathname = usePathname();
  const ready = useRootNavigationState()?.key != null;
  const snapshot = useMoney();
  const latest = useRef({ snapshot, pathname });
  latest.current = { snapshot, pathname };

  useEffect(() => {
    if (!ready) return;
    let gone = false;
    let stop = () => {};
    // The same tap can arrive as the stored launch response and as an event; open the close once.
    const seen = new Set<string>();
    import('expo-notifications')
      .then((Notifications) => {
        if (gone) return;
        const open = (response: {
          readonly actionIdentifier: string;
          readonly notification: {
            readonly date: number;
            readonly request: { readonly identifier: string };
          };
        }) => {
          if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
          const { identifier } = response.notification.request;
          const key = `${identifier}@${response.notification.date}`;
          if (seen.has(key)) return;
          seen.add(key);
          const { snapshot: current, pathname: path } = latest.current;
          if (path === '/close') return;
          if (routeForTappedNotification(identifier, current) === '/close') router.push('/close');
        };
        const sub = Notifications.addNotificationResponseReceivedListener(open);
        stop = () => sub.remove();
        const launch = Notifications.getLastNotificationResponse();
        if (launch) {
          Notifications.clearLastNotificationResponse();
          open(launch);
        }
      })
      .catch(() => undefined);
    return () => {
      gone = true;
      stop();
    };
  }, [ready, router]);

  return null;
}
