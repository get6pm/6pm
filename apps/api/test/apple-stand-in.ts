import { vi } from 'vitest';

import { APPLE_KEYS_URL, forgetAppleKeys } from '../src/together/apple-identity';

/**
 * Apple, stood in for: a key pair made for the test run, its public half served where Apple
 * publishes its keys, and tokens signed with it the way Apple signs identity tokens.
 */

const KID = 'test-key';
const pair = await crypto.subtle.generateKey(
  {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  },
  true,
  ['sign', 'verify'],
);
const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);

const realFetch = globalThis.fetch;

/** Serves the stand-in key set at Apple's address; everything else goes out as usual. */
export function serveAppleKeys(): void {
  forgetAppleKeys();
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === APPLE_KEYS_URL) {
      return Promise.resolve(Response.json({ keys: [{ ...publicJwk, kid: KID, use: 'sig' }] }));
    }
    return realFetch(input, init);
  });
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

const part = (value: unknown) => base64Url(new TextEncoder().encode(JSON.stringify(value)));

/** A JWT signed with the stand-in key, with Apple's usual claims unless `claims` overrides them. */
export async function appleJwt(
  claims: Record<string, unknown>,
  { kid = KID, key = pair.privateKey }: { kid?: string; key?: CryptoKey } = {},
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${part({ alg: 'RS256', kid })}.${part({
    iss: 'https://appleid.apple.com',
    aud: 'ai.sixpm.app.dev',
    iat: now,
    exp: now + 600,
    ...claims,
  })}`;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

/** A key Apple never published, to sign forgeries with. */
export async function strangerKey(): Promise<CryptoKey> {
  const other = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  return other.privateKey;
}
