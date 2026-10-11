import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { scheduleCloseReminder } from '../onboarding/close-reminder';
import { refreshReminderPermission, useReminderPermission } from './reminder-permission';

/**
 * Keeps the daily close reminder matching the plan: it is scheduled on launch, when the close time
 * or the language changes, and when the user allows notifications in iOS Settings and comes back.
 * Nothing is scheduled before a plan exists or while notifications are not allowed.
 */
export function CloseReminderSync() {
  const { language } = useI18n();
  const closeAt = useMoney().plan?.closeAt ?? null;
  const permission = useReminderPermission();

  useEffect(() => {
    void refreshReminderPermission();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshReminderPermission();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (closeAt === null || permission !== 'granted') return;
    scheduleCloseReminder(language, closeAt).catch(() => undefined);
  }, [closeAt, language, permission]);

  return null;
}
