import { getRandomBytes } from 'expo-crypto';
import { Directory, File } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { defaultDatabaseDirectory, deleteDatabaseAsync } from 'expo-sqlite';

import { moveDatabaseAside, type DatabaseFiles } from './database-aside';

const KEY_NAME = 'sixpm.database-key';

// This device only, readable after first unlock so the app can open the store when iOS wakes it
// in the background. Extensions never open the store; they leave files in the App Group inbox.
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/**
 * Makes sure the SQLCipher key exists before the database opens: 32 random bytes, made on first
 * launch and kept in the Keychain.
 *
 * The key never leaves this iPhone, but the database file does: an iCloud or Quick Start restore
 * brings the file to a new phone without its key, and it can never be opened again. So when a key
 * has to be made, any database file already there is from another device: it is moved aside to a
 * dated name beside it (only the newest such copy is kept) rather than deleted, and the user's
 * days come back through 6pm's own encrypted backup instead. A Keychain read that fails (rather
 * than finding nothing) throws, so a locked Keychain never costs the user their data.
 */
export async function ensureDatabaseKey(databaseName: string): Promise<void> {
  if (await SecureStore.getItemAsync(KEY_NAME, OPTIONS)) return;
  await clearUnreadableDatabase(databaseName);
  const key = Array.from(getRandomBytes(32), (b) => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(KEY_NAME, key, OPTIONS);
}

function databaseFiles(): DatabaseFiles {
  const path = String(defaultDatabaseDirectory);
  const directory = new Directory(path.startsWith('file:') ? path : `file://${path}`);
  return {
    names: () => (directory.exists ? directory.list().map((entry) => entry.name) : []),
    rename: (from, to) => new File(directory, from).rename(to),
    remove: (name) => new File(directory, name).delete(),
  };
}

/**
 * Gets a database file this phone has no key for out of the way. When it cannot be moved, the app
 * would never start with a fresh key against it, so it is deleted as a last resort.
 */
async function clearUnreadableDatabase(databaseName: string): Promise<void> {
  try {
    moveDatabaseAside(databaseFiles(), databaseName, new Date());
  } catch {
    await deleteDatabaseAsync(databaseName).catch(() => undefined);
  }
}

/** The key made by `ensureDatabaseKey`. */
export async function databaseKey(): Promise<string> {
  const key = await SecureStore.getItemAsync(KEY_NAME, OPTIONS);
  if (!key) throw new Error('The database key is missing');
  return key;
}
