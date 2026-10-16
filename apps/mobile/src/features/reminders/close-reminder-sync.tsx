import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { scheduleCloseReminder } from '../onboarding/close-reminder';
import { refreshReminderPermission, useReminderPermission } from './reminder-permission';

/**
 * Keeps the close reminders matching the plan: one on each coming day that is not closed yet. They
 * are rebuilt on launch, each time the app comes back, after a day is closed, when the close time
 * or the language changes, and when the user allows notifications in iOS Settings and comes back.
 * Nothing is scheduled before a plan exists or while notifications are not allowed.
 */
export function CloseReminderSync() {
  const { language } = useI18n();
  const money = useMoney();
  const closeAt = money.plan?.closeAt ?? null;
  const { today } = money;
  const closed = money.closedDays.map((day) => day.day).join(',');
  const permission = useReminderPermission();
  const [returns, setReturns] = useState(0);

  useEffect(() => {
    void refreshReminderPermission();
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void refreshReminderPermission();
      setReturns((n) => n + 1);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (closeAt === null || permission !== 'granted') return;
    const closedDays = closed === '' ? [] : closed.split(',');
    scheduleCloseReminder(language, closeAt, closedDays).catch(() => undefined);
  }, [closeAt, language, permission, today, closed, returns]);

  return null;
}
