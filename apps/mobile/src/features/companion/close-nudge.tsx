import { useEffect } from 'react';

import { DEFAULT_CLOSE_AT } from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { takeOverRemindersWhileOpen } from '../onboarding/close-reminder';
import { useCompanionToast } from './use-companion-toast';

/**
 * At close time with 6pm open, the companion says the nudge in the island rather than iOS showing
 * the reminder banner over the app. The nudge lines name six o'clock, so another close time gets
 * the plain line.
 */
export function CloseNudge() {
  const say = useCompanionToast();
  const closeAt = useMoney().plan?.closeAt;
  useEffect(
    () =>
      takeOverRemindersWhileOpen(() =>
        say('nudge', undefined, { plain: closeAt !== DEFAULT_CLOSE_AT }),
      ),
    [say, closeAt],
  );
  return null;
}
