import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useMemo } from 'react';

import {
  buildSnapshot,
  isFreshDatabase,
  restoreSnapshot,
  snapshotItemCount,
} from '../../data/backup-snapshot';
import { createBackupStateStore } from '../../data/backup-state';
import { createBackupService, type BackupService, type DeleteOutcome } from './backup-service';
import { createBackupVault } from './backup-vault';
import { nativeBackupCrypto } from './native-crypto';
import { nativeBackupApi } from './native-backup-api';
import { keychainSecretStore } from './native-secret-store';

// One service per database, so every screen shares one queue of backups, restores and deletes.
const services = new WeakMap<SQLiteDatabase, BackupService>();

function serviceFor(db: SQLiteDatabase): BackupService {
  let service = services.get(db);
  if (service === undefined) {
    service = createBackupService({
      crypto: nativeBackupCrypto,
      vault: createBackupVault(keychainSecretStore),
      api: nativeBackupApi(),
      data: {
        build: (takenAt) => buildSnapshot(db, takenAt),
        restore: (snapshot) => restoreSnapshot(db, snapshot),
        isFresh: () => isFreshDatabase(db),
        itemCount: snapshotItemCount,
      },
      state: createBackupStateStore(db),
      now: Date.now,
    });
    services.set(db, service);
  }
  return service;
}

export function useBackupService(): BackupService {
  const db = useSQLiteContext();
  return useMemo(() => serviceFor(db), [db]);
}

/**
 * Deletes the backup on the server and its key, for "Delete all data" to call before it wipes the
 * phone. `none` when there was no backup (or the Keychain would not say), `deleted` when it is
 * gone, `pending` when the server could not be reached: the key is kept, nothing more is sent,
 * and the delete is finished the next time the app is online.
 */
export function useDeleteBackup(): () => Promise<DeleteOutcome> {
  const service = useBackupService();
  return useCallback(() => service.deleteBackup().catch((): DeleteOutcome => 'none'), [service]);
}
