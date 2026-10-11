import type { SecretStore } from './backup-vault';

// The real Keychain item behind the backup key. It has never run outside a native build, and
// whether a key written on one iPhone arrives on another can only be seen on two real devices
// signed in to one Apple ID with iCloud Keychain on.

const SERVICE = 'ai.sixpm.backup-key';

/**
 * Loaded on first use: a build made before the Keychain module was linked still opens, and backup
 * then reports that the Keychain would not keep the key instead of failing at launch.
 */
const keychain = () => import('react-native-keychain');

/**
 * A Keychain item that iCloud Keychain carries to the person's other devices, end to end encrypted
 * with their own device passcodes: Apple cannot read it, and neither can we. With iCloud Keychain
 * off the item still works on this phone; it just does not travel. The same `cloudSync` flag must
 * be given to every call, or the item is not found. An item kept "this device only" never syncs,
 * so the plain after-first-unlock class is used.
 */
export const keychainSecretStore: SecretStore = {
  read: async () => {
    const found = await (
      await keychain()
    ).getGenericPassword({
      service: SERVICE,
      cloudSync: true,
    });
    return found ? found.password : null;
  },
  write: async (value) => {
    const Keychain = await keychain();
    const saved = await Keychain.setGenericPassword('backup', value, {
      service: SERVICE,
      cloudSync: true,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    });
    if (saved === false) throw new Error('The Keychain did not keep the backup key');
  },
  clear: async () => {
    await (await keychain()).resetGenericPassword({ service: SERVICE, cloudSync: true });
  },
};
