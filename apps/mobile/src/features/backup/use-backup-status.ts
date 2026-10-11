import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { BackupStatus } from './backup-service';
import { useBackupService } from './use-backup';

/**
 * What this phone knows about backup, read again whenever the screen comes into focus: the row in
 * Settings sits under the Backup sheet, so it must catch up when the sheet closes. `null` until
 * the first answer. A Keychain that would not answer reads as backup being off.
 */
export function useBackupStatus(): {
  readonly status: BackupStatus | null;
  readonly refresh: () => Promise<void>;
} {
  const service = useBackupService();
  const [status, setStatus] = useState<BackupStatus | null>(null);

  const refresh = useCallback(async () => {
    setStatus(await service.status().catch((): BackupStatus => ({ kind: 'off' })));
  }, [service]);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      void service
        .status()
        .catch((): BackupStatus => ({ kind: 'off' }))
        .then((next) => {
          if (live) setStatus(next);
        });
      return () => {
        live = false;
      };
    }, [service]),
  );

  return { status, refresh };
}
