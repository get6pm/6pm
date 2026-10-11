/**
 * The cipher the backup needs, so everything above it runs the same on a phone and in a test.
 * Sealed data is base64 of nonce (12) + ciphertext + tag (16), the layout the server checks.
 * Every sealing uses a fresh random nonce, and the associated data ties the ciphertext to this
 * format, so a sealed snapshot cannot be passed off as anything else.
 */
export interface BackupCrypto {
  randomBytes(length: number): Uint8Array;
  sha256(data: Uint8Array): Promise<Uint8Array>;
  /** AES-256-GCM. Resolves to base64 of nonce, ciphertext and tag. */
  seal(plain: Uint8Array, key: Uint8Array, aad: Uint8Array): Promise<string>;
  /** Rejects when the key, the data or the associated data is wrong. */
  open(sealed: string, key: Uint8Array, aad: Uint8Array): Promise<Uint8Array>;
}
