import { BackupError } from './backup-error';
import { fromBase64Url, toBase64Url } from './base64url';
import { BACKUP_KEY_BYTES } from './backup-seal';

/** One place a secret string is kept. A store that cannot be read or written throws. */
export interface SecretStore {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
  clear(): Promise<void>;
}

/** What iCloud Keychain holds for backup: the key, and whether deleting it is still unfinished. */
export interface VaultRecord {
  readonly key: Uint8Array;
  /** "Delete everything" has started but the server has not confirmed: no more uploads. */
  readonly deleting: boolean;
}

export interface BackupVault {
  /** `null` when there is no key. Throws `keychain` when the Keychain would not answer. */
  read(): Promise<VaultRecord | null>;
  /** Keeps a new key. Throws `keychain` when the Keychain would not take it. */
  create(key: Uint8Array): Promise<void>;
  /** Keeps the key but remembers that its backup is being deleted. */
  markDeleting(): Promise<void>;
  /** Forgets the key. */
  clear(): Promise<void>;
}

const PREFIX = 'v1.';
const DELETING = '.deleting';

function serialize(record: VaultRecord): string {
  return `${PREFIX}${toBase64Url(record.key)}${record.deleting ? DELETING : ''}`;
}

/** Anything that is not a record this app wrote (a damaged or foreign value) counts as no key. */
export function parseRecord(text: string): VaultRecord | null {
  if (!text.startsWith(PREFIX)) return null;
  const deleting = text.endsWith(DELETING);
  const body = text.slice(PREFIX.length, deleting ? -DELETING.length : undefined);
  const key = fromBase64Url(body);
  return key !== null && key.length === BACKUP_KEY_BYTES ? { key, deleting } : null;
}

const keychainFailure = (cause: unknown) =>
  new BackupError('keychain', cause instanceof Error ? cause.message : 'The Keychain failed');

export function createBackupVault(store: SecretStore): BackupVault {
  const read = async (): Promise<VaultRecord | null> => {
    let text: string | null;
    try {
      text = await store.read();
    } catch (cause) {
      throw keychainFailure(cause);
    }
    return text === null ? null : parseRecord(text);
  };
  const write = async (record: VaultRecord) => {
    try {
      await store.write(serialize(record));
    } catch (cause) {
      throw keychainFailure(cause);
    }
  };
  return {
    read,
    create: (key) => write({ key, deleting: false }),
    markDeleting: async () => {
      const record = await read();
      if (record !== null && !record.deleting) await write({ ...record, deleting: true });
    },
    clear: async () => {
      try {
        await store.clear();
      } catch (cause) {
        throw keychainFailure(cause);
      }
    },
  };
}
