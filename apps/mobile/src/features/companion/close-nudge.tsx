import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { DEFAULT_CLOSE_AT } from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { takeOverRemindersWhileOpen } from '../onboarding/close-reminder';
import { closeReminderStaysQuiet } from '../reminders/reminder-route';
import { useCompanionToast } from './use-companion-toast';

/**
 * At close time with 6pm open, the companion says the nudge in the island rather than iOS showing
 * the reminder banner over the app. The nudge lines name six o'clock, so another close time gets
 * the plain line. A day already closed, or a close already open, gets no nudge at all.
 */
export function CloseNudge() {
  const say = useCompanionToast();
  const snapshot = useMoney();
  const closeAt = snapshot.plan?.closeAt;
  const pathname = usePathname();
  const latest = useRef({ snapshot, pathname });
  latest.current = { snapshot, pathname };
  useEffect(
    () =>
      takeOverRemindersWhileOpen(
        () => say('nudge', undefined, { plain: closeAt !== DEFAULT_CLOSE_AT }),
        (identifier) =>
          closeReminderStaysQuiet(identifier, latest.current.snapshot, latest.current.pathname),
      ),
    [say, closeAt],
  );
  return null;
}
