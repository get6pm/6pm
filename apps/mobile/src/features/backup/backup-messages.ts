import { isBackupError } from './backup-error';

export type BackupErrorKey =
  | 'backup.error.network'
  | 'backup.error.keychain'
  | 'backup.error.tooLarge'
  | 'backup.deletePending'
  | 'backup.error.generic';

/** The words for a backup or restore that failed. Nothing from the error itself is shown. */
export function errorKeyOf(error: unknown): BackupErrorKey {
  if (!isBackupError(error)) return 'backup.error.generic';
  switch (error.reason) {
    case 'network':
      return 'backup.error.network';
    case 'keychain':
      return 'backup.error.keychain';
    case 'too_large':
      return 'backup.error.tooLarge';
    case 'deleting':
      return 'backup.deletePending';
    case 'wrong_key':
    case 'unsupported':
    case 'damaged':
    case 'exists':
      return 'backup.error.generic';
  }
}

export type UnreadableKey =
  'backup.restore.unsupported' | 'backup.restore.wrongKey' | 'backup.restore.damaged';

/** The words for a backup that is there but cannot be opened. */
export function unreadableKeyOf(reason: 'wrong_key' | 'unsupported' | 'damaged'): UnreadableKey {
  switch (reason) {
    case 'unsupported':
      return 'backup.restore.unsupported';
    case 'wrong_key':
      return 'backup.restore.wrongKey';
    case 'damaged':
      return 'backup.restore.damaged';
  }
}
