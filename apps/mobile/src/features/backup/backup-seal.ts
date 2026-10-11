import {
  BACKUP_FORMAT_VERSION,
  BACKUP_MAX_SEALED_BYTES,
  BACKUP_SNAPSHOT_VERSION,
  backupSnapshotSchema,
  base64DecodedLength,
  type BackupEnvelope,
  type BackupSnapshot,
} from '@6pm/domain';

import type { BackupCrypto } from './backup-crypto';
import { BackupError } from './backup-error';
import { toBase64Url } from './base64url';
import { utf8Decode, utf8Encode } from './utf8';

export const BACKUP_KEY_BYTES = 32;

const aadOf = (version: number) => utf8Encode(`6pm.backup.v${version}`);

/** A new AES-256 key: 32 bytes from the system's generator. */
export function newBackupKey(crypto: BackupCrypto): Uint8Array {
  return crypto.randomBytes(BACKUP_KEY_BYTES);
}

/**
 * The anonymous token a backup is filed under: SHA-256 of a fixed label and the key. The server
 * sees the token and can do nothing with it, since the hash cannot be turned back into the key;
 * and keeping only the key means there is nothing else to lose or to fall out of step.
 */
export async function backupTokenOf(crypto: BackupCrypto, key: Uint8Array): Promise<string> {
  const label = utf8Encode('6pm.backup.token.v1');
  const input = new Uint8Array(label.length + key.length);
  input.set(label);
  input.set(key, label.length);
  return toBase64Url(await crypto.sha256(input));
}

/** The snapshot as one sealed envelope. Refuses one the server would turn away. */
export async function sealSnapshot(
  crypto: BackupCrypto,
  key: Uint8Array,
  snapshot: BackupSnapshot,
): Promise<BackupEnvelope> {
  const plain = utf8Encode(JSON.stringify(backupSnapshotSchema.parse(snapshot)));
  const data = await crypto.seal(plain, key, aadOf(BACKUP_FORMAT_VERSION));
  if (base64DecodedLength(data) > BACKUP_MAX_SEALED_BYTES) throw new BackupError('too_large');
  return { version: BACKUP_FORMAT_VERSION, data };
}

/**
 * The snapshot inside an envelope. A newer format is refused whole, never half understood; a key
 * that does not open it is `wrong_key`; anything that opens but is not a snapshot is `damaged`.
 */
export async function openEnvelope(
  crypto: BackupCrypto,
  key: Uint8Array,
  envelope: BackupEnvelope,
): Promise<BackupSnapshot> {
  if (envelope.version !== BACKUP_FORMAT_VERSION) throw new BackupError('unsupported');
  let plain: Uint8Array;
  try {
    plain = await crypto.open(envelope.data, key, aadOf(envelope.version));
  } catch {
    throw new BackupError('wrong_key');
  }
  const text = utf8Decode(plain);
  if (text === null) throw new BackupError('damaged');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError('damaged');
  }
  const version = (parsed as { version?: unknown } | null)?.version;
  if (typeof version === 'number' && version > BACKUP_SNAPSHOT_VERSION) {
    throw new BackupError('unsupported');
  }
  const checked = backupSnapshotSchema.safeParse(parsed);
  if (!checked.success) throw new BackupError('damaged');
  return checked.data;
}
