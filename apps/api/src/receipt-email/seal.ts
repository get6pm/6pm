import { emailCaptureSchema, type EmailCapture } from '@6pm/domain';

/**
 * Receipts wait in D1 sealed with AES-256-GCM. The key is derived with HKDF-SHA-256 from the
 * `EMAIL_SEAL_KEY` Worker secret, with the device's token hash as the context, so a copy of the
 * database alone opens nothing and one device's key opens no other device's receipts. The
 * capture's id is the associated data: a sealed row cannot be passed off under another id.
 * Stored as base64 of nonce (12) + ciphertext + tag (16).
 */

/** A secret shorter than this is treated as unset: the Worker then takes no mail. */
export const EMAIL_SEAL_KEY_MIN_LENGTH = 32;
const IV_BYTES = 12;
const SALT = new TextEncoder().encode('6pm receipt email');
const encode = (text: string) => new TextEncoder().encode(text);

export function sealKeyOf(env: { readonly EMAIL_SEAL_KEY?: string }): string | null {
  const secret = env.EMAIL_SEAL_KEY;
  return secret !== undefined && secret.length >= EMAIL_SEAL_KEY_MIN_LENGTH ? secret : null;
}

async function captureKey(secret: string, deviceHash: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encode(secret), 'HKDF', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: SALT, info: encode(deviceHash) },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
}

export async function sealCapture(
  secret: string,
  deviceHash: string,
  capture: EmailCapture,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const sealed = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encode(capture.id) },
    await captureKey(secret, deviceHash),
    encode(JSON.stringify(capture)),
  );
  const out = new Uint8Array(IV_BYTES + sealed.byteLength);
  out.set(iv);
  out.set(new Uint8Array(sealed), IV_BYTES);
  return toBase64(out);
}

/** The capture, or null when it cannot be opened (another key, another id, damaged). */
export async function openCapture(
  secret: string,
  deviceHash: string,
  id: string,
  sealed: string,
): Promise<EmailCapture | null> {
  try {
    const bytes = fromBase64(sealed);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes.slice(0, IV_BYTES), additionalData: encode(id) },
      await captureKey(secret, deviceHash),
      bytes.slice(IV_BYTES),
    );
    const parsed = emailCaptureSchema.safeParse(JSON.parse(new TextDecoder().decode(plain)));
    return parsed.success && parsed.data.id === id ? parsed.data : null;
  } catch {
    return null;
  }
}
