import type { BackupSnapshot } from '@6pm/domain';

import { SnapshotRefused } from '../../data/backup-snapshot';
import type { BackupStateStore } from '../../data/backup-state';
import type { BackupApi } from './backup-api';
import type { BackupCrypto } from './backup-crypto';
import { BackupError, isBackupError, type BackupFailure } from './backup-error';
import { backupIsDue } from './backup-schedule';
import { backupTokenOf, newBackupKey, openEnvelope, sealSnapshot } from './backup-seal';
import type { BackupVault } from './backup-vault';

/** The phone's database, as backup needs it. */
export interface BackupData {
  build(takenAt: string): Promise<BackupSnapshot>;
  restore(snapshot: BackupSnapshot): Promise<void>;
  isFresh(): Promise<boolean>;
  itemCount(snapshot: BackupSnapshot): number;
}

export interface BackupServiceDeps {
  readonly crypto: BackupCrypto;
  readonly vault: BackupVault;
  readonly api: BackupApi;
  readonly data: BackupData;
  readonly state: BackupStateStore;
  readonly now: () => number;
}

/** What this phone knows about backup without asking the server. */
export type BackupStatus =
  /** No key: nothing has ever been backed up from here or from another iPhone on this Apple ID. */
  | { readonly kind: 'off' }
  /** This phone owns the backup: it sent the last one, or took it back. */
  | {
      readonly kind: 'on';
      readonly lastAt: string | null;
      readonly items: number | null;
      readonly tooLarge: boolean;
    }
  /** A key is here but this phone has not yet decided about the backup that may be on the server. */
  | { readonly kind: 'unsettled' }
  /** "Delete everything" has started and has not reached the server yet. */
  | { readonly kind: 'deleting' };

export interface RestoreOffer {
  readonly snapshot: BackupSnapshot;
  /** When the server kept it. */
  readonly updatedAt: string;
  readonly items: number;
}

export type RestoreSearch =
  | { readonly kind: 'none' }
  | { readonly kind: 'found'; readonly offer: RestoreOffer }
  /** A backup is there but cannot be opened. `unsupported` means a newer 6pm wrote it. */
  | {
      readonly kind: 'unreadable';
      readonly reason: Extract<BackupFailure, 'wrong_key' | 'unsupported' | 'damaged'>;
    };

export type DeleteOutcome = 'deleted' | 'none' | 'pending';

export interface BackupService {
  status(): Promise<BackupStatus>;
  /**
   * True when a key is here, this phone has not decided about the backup under it, and the server
   * does hold one. Cheap: asks the server only whether it is there. False when it cannot be asked.
   */
  hasUnclaimedBackup(): Promise<boolean>;
  /**
   * Looks for a backup to bring back. Asks the server only when a key is here and this phone has
   * not yet decided; throws `network` when the server cannot be asked.
   */
  findRestore(): Promise<RestoreSearch>;
  /** Replaces everything on this phone with the backup. Nothing changes if it fails. */
  restore(offer: RestoreOffer): Promise<void>;
  /** Lets this phone's own backups replace the one on the server ("start fresh", "replace it"). */
  declineRestore(): Promise<void>;
  /**
   * Sends a backup now. Makes the key on the first one. Does nothing, and says so, on a phone
   * with nothing in it. Throws `exists` when the server holds a backup this phone has not taken or
   * declined, `too_large`, `keychain`, `deleting` or `network`.
   */
  backUpNow(): Promise<'sent' | 'empty'>;
  /** The automatic backup: sends when due, and never throws. */
  backUpIfDue(latestClosedAt: number | null): Promise<boolean>;
  /** Deletes the backup on the server and the key. `pending` means the server was not reached. */
  deleteBackup(): Promise<DeleteOutcome>;
  /** Tries again a delete that did not reach the server. True when nothing is pending now. */
  finishPendingDelete(): Promise<boolean>;
}

export function createBackupService(deps: BackupServiceDeps): BackupService {
  const { crypto, vault, api, data, state } = deps;

  // Backups, restores and deletes take turns: two at once could send a half-restored phone.
  let turn: Promise<unknown> = Promise.resolve();
  const inTurn = <T>(task: () => Promise<T>): Promise<T> => {
    const run = turn.then(task, task);
    turn = run.catch(() => undefined);
    return run;
  };

  async function sendNow(): Promise<'sent' | 'empty'> {
    const record = await vault.read();
    if (record?.deleting) throw new BackupError('deleting');
    if (await data.isFresh()) return 'empty';

    const key = record?.key ?? newBackupKey(crypto);
    const token = await backupTokenOf(crypto, key);
    if (record === null) {
      await vault.create(key);
      // A key made just now has nothing on the server to protect.
      await state.settle();
    } else if (!(await state.read()).settled) {
      if ((await api.meta(token)) !== null) throw new BackupError('exists');
      await state.settle();
    }

    const takenAt = new Date(deps.now()).toISOString();
    const snapshot = await data.build(takenAt);
    let envelope;
    try {
      envelope = await sealSnapshot(crypto, key, snapshot);
    } catch (error) {
      if (isBackupError(error) && error.reason === 'too_large') await state.setTooLarge(true);
      throw error;
    }
    try {
      await api.put(token, envelope);
    } catch (error) {
      if (isBackupError(error) && error.reason === 'too_large') await state.setTooLarge(true);
      throw error;
    }
    await state.recordUpload(takenAt, data.itemCount(snapshot));
    return 'sent';
  }

  async function removeFromServer(key: Uint8Array): Promise<boolean> {
    try {
      await api.remove(await backupTokenOf(crypto, key));
    } catch {
      return false;
    }
    await vault.clear();
    await state.clear();
    return true;
  }

  return {
    status: async () => {
      const record = await vault.read();
      if (record === null) return { kind: 'off' };
      if (record.deleting) return { kind: 'deleting' };
      const local = await state.read();
      if (!local.settled) return { kind: 'unsettled' };
      return { kind: 'on', lastAt: local.lastAt, items: local.items, tooLarge: local.tooLarge };
    },

    hasUnclaimedBackup: () =>
      inTurn(async () => {
        try {
          const record = await vault.read();
          if (record === null || record.deleting || (await state.read()).settled) return false;
          if ((await api.meta(await backupTokenOf(crypto, record.key))) !== null) return true;
          await state.settle();
          return false;
        } catch {
          return false;
        }
      }),

    findRestore: () =>
      inTurn(async () => {
        const record = await vault.read();
        if (record === null || record.deleting || (await state.read()).settled) {
          return { kind: 'none' };
        }
        const stored = await api.get(await backupTokenOf(crypto, record.key));
        if (stored === null) {
          await state.settle();
          return { kind: 'none' };
        }
        try {
          const snapshot = await openEnvelope(crypto, record.key, stored.envelope);
          return {
            kind: 'found',
            offer: { snapshot, updatedAt: stored.updatedAt, items: data.itemCount(snapshot) },
          };
        } catch (error) {
          if (
            isBackupError(error) &&
            ['wrong_key', 'unsupported', 'damaged'].includes(error.reason)
          ) {
            return {
              kind: 'unreadable',
              reason: error.reason as 'wrong_key' | 'unsupported' | 'damaged',
            };
          }
          throw error;
        }
      }),

    restore: (offer) =>
      inTurn(async () => {
        try {
          await data.restore(offer.snapshot);
        } catch (error) {
          if (error instanceof SnapshotRefused) throw new BackupError('damaged', error.message);
          throw error;
        }
        await state.recordUpload(offer.updatedAt, offer.items);
      }),

    declineRestore: () => inTurn(() => state.settle()),

    backUpNow: () => inTurn(sendNow),

    backUpIfDue: (latestClosedAt) =>
      inTurn(async () => {
        try {
          const record = await vault.read();
          if (record === null || record.deleting) return false;
          const local = await state.read();
          // A backup that was too large stays too large until the person has less in it or tries
          // by hand, so the automatic one does not seal it again on every launch.
          if (!local.settled || local.tooLarge) return false;
          const due = backupIsDue({
            now: deps.now(),
            lastAt: local.lastAt === null ? null : Date.parse(local.lastAt),
            latestClosedAt,
          });
          return due && (await sendNow()) === 'sent';
        } catch {
          // Offline, a server fault or a locked Keychain: the next close or launch tries again.
          return false;
        }
      }),

    deleteBackup: () =>
      inTurn(async () => {
        const record = await vault.read();
        if (record === null) {
          await state.clear();
          return 'none';
        }
        await vault.markDeleting();
        return (await removeFromServer(record.key)) ? 'deleted' : 'pending';
      }),

    finishPendingDelete: () =>
      inTurn(async () => {
        try {
          const record = await vault.read();
          if (record === null || !record.deleting) return true;
          return await removeFromServer(record.key);
        } catch {
          return false;
        }
      }),
  };
}
