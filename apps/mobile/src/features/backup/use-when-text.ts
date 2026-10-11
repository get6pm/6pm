import { useCallback } from 'react';

import { useI18n } from '../../i18n/i18n';
import { whenOf } from './backup-when';

/** "just now", "2 minutes ago", "3 days ago" in the current language, for a time and a clock. */
export function useWhenText(): (iso: string, now: number) => string {
  const { t } = useI18n();
  return useCallback(
    (iso, now) => {
      const when = whenOf(iso, now);
      return when.key === 'backup.ago.now' ? t(when.key) : t(when.key, { count: when.count });
    },
    [t],
  );
}
