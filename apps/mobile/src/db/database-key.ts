import { getRandomBytes } from 'expo-crypto';
import { deleteDatabaseAsync } from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';

const KEY_NAME = 'sixpm.database-key';

// This device only, readable after first unlock so widgets and the share extension can open the
// store while the phone is locked.
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/**
 * Makes sure the SQLCipher key exists before the database opens: 32 random bytes, made on first
 * launch and kept in the Keychain.
 *
 * The key never leaves this iPhone, but the database file does: an iCloud or Quick Start restore
 * brings the file to a new phone without its key, and it can never be opened again. So when a key
 * has to be made, any database file already there is from another device and is removed first;
 * the user's days come back through 6pm's own encrypted backup instead. A Keychain read that fails
 * (rather than finding nothing) throws, so a locked Keychain never costs the user their data.
 */
export async function ensureDatabaseKey(databaseName: string): Promise<void> {
  if (await SecureStore.getItemAsync(KEY_NAME, OPTIONS)) return;
  await deleteDatabaseAsync(databaseName).catch(() => undefined); // nothing there on a fresh install
  const key = Array.from(getRandomBytes(32), (b) => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(KEY_NAME, key, OPTIONS);
}

/** The key made by `ensureDatabaseKey`. */
export async function databaseKey(): Promise<string> {
  const key = await SecureStore.getItemAsync(KEY_NAME, OPTIONS);
  if (!key) throw new Error('The database key is missing');
  return key;
}
