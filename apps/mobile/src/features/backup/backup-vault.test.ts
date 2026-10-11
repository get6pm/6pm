import { describe, expect, it } from '@jest/globals';

import { isBackupError } from './backup-error';
import { toBase64Url } from './base64url';
import { createBackupVault, parseRecord, type SecretStore } from './backup-vault';

function memoryStore(initial: string | null = null): SecretStore & { value: string | null } {
  const store = {
    value: initial,
    read: () => Promise.resolve(store.value),
    write: (value: string) => {
      store.value = value;
      return Promise.resolve();
    },
    clear: () => {
      store.value = null;
      return Promise.resolve();
    },
  };
  return store;
}

const KEY = Uint8Array.from({ length: 32 }, (_, i) => i + 1);

describe('the backup vault', () => {
  it('keeps the key and gives it back', async () => {
    const vault = createBackupVault(memoryStore());
    expect(await vault.read()).toBeNull();
    await vault.create(KEY);
    expect(await vault.read()).toEqual({ key: KEY, deleting: false });
  });

  it('remembers that a delete has started, and forgets everything when cleared', async () => {
    const store = memoryStore();
    const vault = createBackupVault(store);
    await vault.create(KEY);
    await vault.markDeleting();
    expect(await vault.read()).toEqual({ key: KEY, deleting: true });
    await vault.clear();
    expect(store.value).toBeNull();
    expect(await vault.read()).toBeNull();
  });

  it('does not store the key in plain bytes it cannot read back', () => {
    expect(parseRecord(`v1.${toBase64Url(KEY)}`)).toEqual({ key: KEY, deleting: false });
    expect(parseRecord(`v1.${toBase64Url(KEY)}.deleting`)).toEqual({ key: KEY, deleting: true });
  });

  it('counts a damaged or foreign value as no key', () => {
    expect(parseRecord('hello')).toBeNull();
    expect(parseRecord('v1.')).toBeNull();
    expect(parseRecord(`v1.${toBase64Url(KEY.subarray(0, 16))}`)).toBeNull();
    expect(parseRecord(`v2.${toBase64Url(KEY)}`)).toBeNull();
  });

  it('tells a Keychain that will not answer from one with no key', async () => {
    const broken: SecretStore = {
      read: () => Promise.reject(new Error('locked')),
      write: () => Promise.reject(new Error('locked')),
      clear: () => Promise.reject(new Error('locked')),
    };
    const vault = createBackupVault(broken);
    for (const attempt of [() => vault.read(), () => vault.create(KEY), () => vault.clear()]) {
      const failure: unknown = await attempt().then(
        () => null,
        (error: unknown) => error,
      );
      expect(isBackupError(failure) && failure.reason).toBe('keychain');
    }
  });
});
