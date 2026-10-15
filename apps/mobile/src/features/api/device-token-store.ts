import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

import { deviceTokenPattern } from '@6pm/domain';

/** Where this phone keeps the anonymous token the server knows it by. */
export interface DeviceTokenStore {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
}

const KEY_NAME = 'sixpm.device-token';

/** The App Group doubles as a keychain group, so the share extension reads the same token. */
function sharedGroup(): string | undefined {
  const group: unknown = Constants.expoConfig?.extra?.['appGroup'];
  return typeof group === 'string' && group !== '' ? group : undefined;
}

// This device only: the token names an anonymous device, so it must not travel in a backup to
// another phone. Readable after first unlock so a background task can still reach the server.
const LOCAL: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

function sharedOptions(): SecureStore.SecureStoreOptions {
  const accessGroup = sharedGroup();
  return accessGroup === undefined ? LOCAL : { ...LOCAL, accessGroup };
}

function valid(token: string | null): string | null {
  // A value that is not a token (damaged, or from another build) counts as none.
  return token !== null && deviceTokenPattern.test(token) ? token : null;
}

export const secureDeviceTokenStore: DeviceTokenStore = {
  read: async () => {
    const shared = valid(await SecureStore.getItemAsync(KEY_NAME, sharedOptions()));
    if (shared !== null || sharedGroup() === undefined) return shared;
    // A token saved before it was shared moves into the group, so the extension can reach it.
    const local = valid(await SecureStore.getItemAsync(KEY_NAME, LOCAL));
    if (local !== null) {
      await SecureStore.setItemAsync(KEY_NAME, local, sharedOptions()).catch(() => undefined);
    }
    return local;
  },
  write: (token) => SecureStore.setItemAsync(KEY_NAME, token, sharedOptions()),
};
