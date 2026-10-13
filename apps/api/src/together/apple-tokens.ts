import type { Secrets } from '../env';
import { APPLE_ISSUER, APPLE_TEAM_ID } from './apple-identity';

/**
 * Apple's token endpoints, for account deletion: the sign-in's one-time code is exchanged for a
 * refresh token, and deleting the account revokes it, so the app no longer shows under "Sign in
 * with Apple" in the person's Apple ID settings. Both need a client secret: a short JWT signed
 * with the app's Sign in with Apple key (`APPLE_SIGN_IN_KEY`, `APPLE_SIGN_IN_KEY_ID`). Without
 * those secrets nothing is exchanged and deleting removes the data alone.
 */

const TOKEN_URL = 'https://appleid.apple.com/auth/token';
const REVOKE_URL = 'https://appleid.apple.com/auth/revoke';
const TIMEOUT_MS = 8000;

type AppleSecrets = Pick<Secrets, 'APPLE_SIGN_IN_KEY' | 'APPLE_SIGN_IN_KEY_ID'>;

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

const jsonPart = (value: unknown) => base64Url(new TextEncoder().encode(JSON.stringify(value)));

/** The PKCS #8 bytes of a `.p8` key, with or without its PEM lines. */
function pkcs8Of(pem: string): Uint8Array<ArrayBuffer> {
  const body = pem
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '')
    .replaceAll('\\n', '')
    .replace(/\s+/g, '');
  return Uint8Array.from(atob(body), (char) => char.charCodeAt(0));
}

/** The client secret for `clientId`, or null when the key is not set for this environment. */
export async function appleClientSecret(
  secrets: AppleSecrets,
  clientId: string,
  now = Date.now(),
): Promise<string | null> {
  const pem = secrets.APPLE_SIGN_IN_KEY;
  const keyId = secrets.APPLE_SIGN_IN_KEY_ID;
  if (pem === undefined || pem === '' || keyId === undefined || keyId === '') return null;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8Of(pem),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const iat = Math.floor(now / 1000);
  const unsigned = `${jsonPart({ alg: 'ES256', kid: keyId })}.${jsonPart({
    iss: APPLE_TEAM_ID,
    iat,
    exp: iat + 300,
    aud: APPLE_ISSUER,
    sub: clientId,
  })}`;
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

async function post(url: string, form: Record<string, string>): Promise<Response | null> {
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form).toString(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return null;
  }
}

/** Exchanges a sign-in's one-time code for a refresh token; null when it cannot be done. */
export async function exchangeAppleCode(
  secrets: AppleSecrets,
  clientId: string,
  code: string,
): Promise<string | null> {
  const secret = await appleClientSecret(secrets, clientId).catch(() => null);
  if (secret === null) return null;
  const response = await post(TOKEN_URL, {
    client_id: clientId,
    client_secret: secret,
    code,
    grant_type: 'authorization_code',
  });
  if (response === null || !response.ok) return null;
  const body: unknown = await response.json().catch(() => null);
  const token = (body as { refresh_token?: unknown } | null)?.refresh_token;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

/** Revokes a refresh token. Whether Apple took it; a failure never stops a deletion. */
export async function revokeAppleToken(
  secrets: AppleSecrets,
  clientId: string,
  refreshToken: string,
): Promise<boolean> {
  const secret = await appleClientSecret(secrets, clientId).catch(() => null);
  if (secret === null) return false;
  const response = await post(REVOKE_URL, {
    client_id: clientId,
    client_secret: secret,
    token: refreshToken,
    token_type_hint: 'refresh_token',
  });
  return response?.ok ?? false;
}
