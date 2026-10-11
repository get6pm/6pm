import { useCallback } from 'react';

import type { BackupSnapshot } from '@6pm/domain';
import type { Language } from '@6pm/i18n';

import { planSettingsSchema } from '../../data/plan-settings';
import { useMoneyActions } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useLookSettingsStore } from '../looks/look-settings-provider';
import { askForReminders, scheduleCloseReminder } from '../onboarding/close-reminder';
import { refreshReminderPermission } from '../reminders/reminder-permission';

/** Asks for notifications (a restored phone never saw onboarding's question) and sets the reminder. */
async function remindAfterRestore(rawPlan: string | null | undefined, language: Language) {
  try {
    const plan = planSettingsSchema.parse(JSON.parse(rawPlan ?? ''));
    const allowed = await askForReminders();
    await refreshReminderPermission();
    if (allowed) await scheduleCloseReminder(language, plan.closeAt);
  } catch {
    // No plan to remind about, or notifications are unavailable: the restore itself is done.
  }
}

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
      // The restore does not wait on the permission alert: the reminder follows the answer.
      void remindAfterRestore(settings.plan, restored ?? language);
    },
    [reload, lookStore, language, setLanguage],
  );
}
