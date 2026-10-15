import { emailCaptureSchema, type EmailCapture } from '@6pm/domain';

/**
 * Receipts wait in D1 sealed with AES-256-GCM. The key is derived with HKDF-SHA-256 from the
 * `EMAIL_SEAL_KEY` Worker secret, with the device's token hash as the context, so a copy of the
 * database alone opens nothing and one device's key opens no other device's receipts. The
 * capture's id is the associated data: a sealed row cannot be passed off under another id. A
 * forwarding check is sealed the same way, under `forwarding:<id>`, so neither opens as the other.
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

/** Seals any JSON value for one device; `label` is the associated data it must be opened with. */
export async function sealFor(
  secret: string,
  deviceHash: string,
  label: string,
  value: unknown,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const sealed = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encode(label) },
    await captureKey(secret, deviceHash),
    encode(JSON.stringify(value)),
  );
  const out = new Uint8Array(IV_BYTES + sealed.byteLength);
  out.set(iv);
  out.set(new Uint8Array(sealed), IV_BYTES);
  return toBase64(out);
}

/** The JSON value sealed under `label`, or null when it cannot be opened. */
export async function openFor(
  secret: string,
  deviceHash: string,
  label: string,
  sealed: string,
): Promise<unknown> {
  try {
    const bytes = fromBase64(sealed);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes.slice(0, IV_BYTES), additionalData: encode(label) },
      await captureKey(secret, deviceHash),
      bytes.slice(IV_BYTES),
    );
    return JSON.parse(new TextDecoder().decode(plain)) as unknown;
  } catch {
    return null;
  }
}

export function sealCapture(
  secret: string,
  deviceHash: string,
  capture: EmailCapture,
): Promise<string> {
  return sealFor(secret, deviceHash, capture.id, capture);
}

/** The capture, or null when it cannot be opened (another key, another id, damaged). */
export async function openCapture(
  secret: string,
  deviceHash: string,
  id: string,
  sealed: string,
): Promise<EmailCapture | null> {
  const parsed = emailCaptureSchema.safeParse(await openFor(secret, deviceHash, id, sealed));
  return parsed.success && parsed.data.id === id ? parsed.data : null;
}
