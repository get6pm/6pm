import type { BackupCrypto } from '../backup-crypto';

// The cipher on Node, in the layout the phone's native cipher produces: nonce (12), ciphertext,
// tag (16), base64. It stands in for the native module in unit tests only.
const nodeCrypto = process.getBuiltinModule('node:crypto');

const IV_BYTES = 12;
const TAG_BYTES = 16;

export const nodeBackupCrypto: BackupCrypto = {
  randomBytes: (length) => new Uint8Array(nodeCrypto.randomBytes(length)),
  sha256: (data) =>
    Promise.resolve(new Uint8Array(nodeCrypto.createHash('sha256').update(data).digest())),
  seal: (plain, key, aad) => {
    const iv = nodeCrypto.randomBytes(IV_BYTES);
    const cipher = nodeCrypto.createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(aad);
    const body = Buffer.concat([cipher.update(plain), cipher.final()]);
    return Promise.resolve(Buffer.concat([iv, body, cipher.getAuthTag()]).toString('base64'));
  },
  open: (sealed, key, aad) =>
    new Promise((resolve, reject) => {
      try {
        const bytes = Buffer.from(sealed, 'base64');
        const decipher = nodeCrypto.createDecipheriv(
          'aes-256-gcm',
          key,
          bytes.subarray(0, IV_BYTES),
        );
        decipher.setAAD(aad);
        decipher.setAuthTag(bytes.subarray(bytes.length - TAG_BYTES));
        const plain = Buffer.concat([
          decipher.update(bytes.subarray(IV_BYTES, bytes.length - TAG_BYTES)),
          decipher.final(),
        ]);
        resolve(new Uint8Array(plain));
      } catch (error) {
        reject(error instanceof Error ? error : new Error('The data did not open'));
      }
    }),
};
