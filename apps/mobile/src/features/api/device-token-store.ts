import * as SecureStore from 'expo-secure-store';

import { deviceTokenPattern } from '@6pm/domain';

/** Where this phone keeps the anonymous token the server knows it by. */
export interface DeviceTokenStore {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
}

const KEY_NAME = 'sixpm.device-token';

// This device only: the token names an anonymous device, so it must not travel in a backup to
// another phone. Readable after first unlock so a background task can still reach the server.
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export const secureDeviceTokenStore: DeviceTokenStore = {
  read: async () => {
    const token = await SecureStore.getItemAsync(KEY_NAME, OPTIONS);
    // A value that is not a token (damaged, or from another build) counts as none.
    return token !== null && deviceTokenPattern.test(token) ? token : null;
  },
  write: (token) => SecureStore.setItemAsync(KEY_NAME, token, OPTIONS),
};
