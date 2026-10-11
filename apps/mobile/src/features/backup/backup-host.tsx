import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useMoney } from '../../data/money-provider';
import { useEntitlement } from '../purchases/purchases-provider';
import { useBackupService } from './use-backup';

/**
 * Keeps the backup going without anyone asking: sends one after a day is closed, and otherwise
 * once a day, only for Max members who turned backup on. It also finishes a "delete everything"
 * that could not reach the server. Renders nothing; mount it once inside the money and purchases
 * providers.
 */
export function BackupHost() {
  const service = useBackupService();
  const { max } = useEntitlement();
  const { closedDays } = useMoney();
  const latestClosedAt = closedDays.reduce<number | null>((latest, day) => {
    const at = Date.parse(day.closedAt);
    return Number.isFinite(at) && (latest === null || at > latest) ? at : latest;
  }, null);

  useEffect(() => {
    const check = () => {
      void service
        .finishPendingDelete()
        .then(() => (max ? service.backUpIfDue(latestClosedAt) : false));
    };
    check();
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => app.remove();
  }, [service, max, latestClosedAt]);

  return null;
}
