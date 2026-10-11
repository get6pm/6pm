import { useCallback } from 'react';

import type { BackupSnapshot } from '@6pm/domain';

import { planSettingsSchema } from '../../data/plan-settings';
import { useMoneyActions } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useLookSettingsStore } from '../looks/look-settings-provider';
import { scheduleCloseReminder } from '../onboarding/close-reminder';

/**
 * What the screens must do once a restore has replaced the database: read the store again, bring
 * the look and the language back on screen, and schedule the daily close reminder, which belongs
 * to the phone and did not come with the backup.
 */
export function useApplyRestore(): (settings: BackupSnapshot['settings']) => Promise<void> {
  const { reload } = useMoneyActions();
  const lookStore = useLookSettingsStore();
  const { language, setLanguage } = useI18n();
  return useCallback(
    async (settings) => {
      await reload();
      await lookStore.reload();
      const restored =
        settings.language === 'en' || settings.language === 'vi' ? settings.language : null;
      setLanguage(restored);
      try {
        const plan = planSettingsSchema.parse(JSON.parse(settings.plan ?? ''));
        await scheduleCloseReminder(restored ?? language, plan.closeAt);
      } catch {
        // No plan to remind about, or notifications are off: the restore itself is done.
      }
    },
    [reload, lookStore, language, setLanguage],
  );
}
