import * as Sentry from '@sentry/react-native';
import { useCallback } from 'react';

import { useI18n } from '../../i18n/i18n';
import { useToast } from '../../ui/toast/toast-host';

/**
 * Runs a write the user asked for without letting a failure escape as an unhandled rejection: the
 * failure is reported, and the island says the change did not save. Resolves to whether it worked,
 * so a handler can hold back its follow-up (a haptic, closing the sheet) when it did not.
 */
export function useRunAction() {
  const toast = useToast();
  const { t } = useI18n();
  return useCallback(
    async (task: () => Promise<unknown>): Promise<boolean> => {
      try {
        await task();
        return true;
      } catch (error) {
        Sentry.captureException(error);
        toast(t('action.failed'));
        return false;
      }
    },
    [toast, t],
  );
}
