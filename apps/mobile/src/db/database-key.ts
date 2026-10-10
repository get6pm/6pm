import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY_NAME = 'sixpm.database-key';

/**
 * The SQLCipher key for the money database: 32 random bytes, made on first launch and kept in the
 * Keychain (this device only, readable after first unlock so widgets and the share extension can
 * open the store while the phone is locked).
 */
export async function databaseKey(): Promise<string> {
  const options: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  };
  const existing = await SecureStore.getItemAsync(KEY_NAME, options);
  if (existing) return existing;
  const key = Array.from(getRandomBytes(32), (b) => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(KEY_NAME, key, options);
  return key;
}
