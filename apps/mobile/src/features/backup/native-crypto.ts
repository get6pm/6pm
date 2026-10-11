import * as Crypto from 'expo-crypto';

import { BACKUP_IV_BYTES, BACKUP_TAG_BYTES } from '@6pm/domain';

import type { BackupCrypto } from './backup-crypto';

// The real cipher behind the backup: expo-crypto's native AES-GCM (CryptoKit on iOS), which is
// already linked, so it adds no native module. The unit tests run the same layout through Node's
// own cipher; this file itself only runs in a native build.

/** nonce (12) + ciphertext + tag (16), the same layout the server checks and the tests use. */
const sealedConfig = { ivLength: BACKUP_IV_BYTES, tagLength: BACKUP_TAG_BYTES } as const;

export const nativeBackupCrypto: BackupCrypto = {
  randomBytes: (length) => Crypto.getRandomBytes(length),
  sha256: async (data) =>
    new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new Uint8Array(data))),
  seal: async (plain, key, aad) => {
    const sealed = await Crypto.aesEncryptAsync(plain, await Crypto.AESEncryptionKey.import(key), {
      nonce: { length: BACKUP_IV_BYTES },
      additionalData: aad,
    });
    return sealed.combined('base64');
  },
  open: async (sealed, key, aad) =>
    Crypto.aesDecryptAsync(
      Crypto.AESSealedData.fromCombined(sealed, sealedConfig),
      await Crypto.AESEncryptionKey.import(key),
      { output: 'bytes', additionalData: aad },
    ),
};
