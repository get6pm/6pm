import { useCallback } from 'react';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useTheme } from '../../ui/theme/theme';
import { useToast } from '../../ui/toast/toast-host';

/** The companion's lines for a backup that finished and a backup that came back. */
export function useBackupToast() {
  const toast = useToast();
  const { t } = useI18n();
  const { serious } = useTheme();
  const persona = useMoney().plan?.persona ?? 'cheeky';
  return useCallback(
    (event: 'backupDone' | 'backupRestored') => {
      const voice = serious ? 'plain' : persona;
      toast(t(`companion.${event}.${voice}`));
    },
    [toast, t, serious, persona],
  );
}
