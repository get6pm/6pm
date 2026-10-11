/**
 * Why a backup or a restore did not happen. The reason picks the words the person is told; the
 * message is for logs and never holds a key, a token or anything from the snapshot.
 */
export type BackupFailure =
  /** The sealed snapshot is over what the server keeps. */
  | 'too_large'
  /** The key from iCloud Keychain does not open the backup. */
  | 'wrong_key'
  /** Written by a newer 6pm than this one understands. */
  | 'unsupported'
  /** Opened, but not a snapshot this app can read. */
  | 'damaged'
  /** The key could not be kept in the Keychain, so nothing could be restored later. */
  | 'keychain'
  /** A backup from another iPhone is already there; sending this one would replace it. */
  | 'exists'
  /** Delete everything is still waiting to reach the server. */
  | 'deleting'
  /** The server could not be reached or refused. */
  | 'network';

export class BackupError extends Error {
  readonly reason: BackupFailure;

  constructor(reason: BackupFailure, message: string = reason) {
    super(message);
    this.name = 'BackupError';
    this.reason = reason;
  }
}

export function isBackupError(error: unknown): error is BackupError {
  return error instanceof BackupError;
}
