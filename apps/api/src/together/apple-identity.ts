import { ApiError } from '../errors';

/**
 * Sign in with Apple, checked on the server: an identity token is a JWT that Apple signs with one
 * of the keys it publishes. It is taken only when the signature holds, Apple issued it, it was
 * made for one of the 6pm apps and it has not expired.
 */

export const APPLE_ISSUER = 'https://appleid.apple.com';
export const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';
/** The bundle ids a token may be made for: the store app and the dev build. */
export const APPLE_AUDIENCES = ['ai.sixpm.app', 'ai.sixpm.app.dev'] as const;
export const APPLE_TEAM_ID = 'YFND2EEW8S';

/** Apple's keys change rarely; they are fetched again after this, or when a token names a new one. */
const KEYS_TTL_MS = 60 * 60 * 1000;
/** Clocks differ a little: a token is still taken this long after its `exp`. */
const SKEW_S = 60;

type AppleJwk = JsonWebKey & { kid: string };
let cached: { keys: AppleJwk[]; at: number } | null = null;

/** Forgets Apple's keys, so the next check fetches them again. */
export function forgetAppleKeys(): void {
  cached = null;
}

async function appleKeys(fresh: boolean, now: number): Promise<AppleJwk[]> {
  if (!fresh && cached !== null && now - cached.at < KEYS_TTL_MS) return cached.keys;
  let response: Response;
  try {
    response = await fetch(APPLE_KEYS_URL, { headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError('internal', 'Apple could not be reached');
  }
  if (!response.ok) throw new ApiError('internal', 'Apple could not be reached');
  const body: unknown = await response.json().catch(() => null);
  const keys =
    typeof body === 'object' && body !== null && Array.isArray((body as { keys?: unknown }).keys)
      ? (body as { keys: unknown[] }).keys.filter(
          (k): k is AppleJwk =>
            typeof k === 'object' && k !== null && typeof (k as { kid?: unknown }).kid === 'string',
        )
      : [];
  cached = { keys, at: now };
  return keys;
}

export function base64UrlBytes(text: string): Uint8Array<ArrayBuffer> {
  const base64 = text.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function jsonPart(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(base64UrlBytes(text)));
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// Not `unauthorized`: that answer tells the phone its device token is unknown.
const refused = () =>
  new ApiError('forbidden', 'The Apple sign-in could not be checked', { reason: 'apple_refused' });

/** Whether `signature` over `signed` holds for an RS256 key from Apple's set. */
async function signedBy(jwk: AppleJwk, signed: string, signature: string): Promise<boolean> {
  try {
    const keyData: JsonWebKey = { kty: 'RSA', alg: 'RS256', ext: true };
    if (jwk.n !== undefined) keyData.n = jwk.n;
    if (jwk.e !== undefined) keyData.e = jwk.e;
    const key = await crypto.subtle.importKey(
      'jwk',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlBytes(signature),
      new TextEncoder().encode(signed),
    );
  } catch {
    return false;
  }
}

/** The claims of a JWT Apple signed for one of `audiences`, or a `forbidden` error. */
export async function verifyAppleJwt(
  token: string,
  audiences: readonly string[] = APPLE_AUDIENCES,
  now = Date.now(),
): Promise<Record<string, unknown>> {
  const parts = token.split('.');
  if (parts.length !== 3) throw refused();
  const [head = '', body = '', signature = ''] = parts;
  const header = jsonPart(head);
  const claims = jsonPart(body);
  if (header === null || claims === null) throw refused();
  if (header['alg'] !== 'RS256' || typeof header['kid'] !== 'string') throw refused();
  const kid = header['kid'];

  let jwk = (await appleKeys(false, now)).find((k) => k.kid === kid);
  // A key Apple has only just published: fetch the set again once.
  jwk ??= (await appleKeys(true, now)).find((k) => k.kid === kid);
  if (jwk === undefined) throw refused();

  if (!(await signedBy(jwk, `${head}.${body}`, signature))) throw refused();

  const exp = claims['exp'];
  const aud = claims['aud'];
  if (claims['iss'] !== APPLE_ISSUER) throw refused();
  if (typeof aud !== 'string' || !audiences.includes(aud)) throw refused();
  if (typeof exp !== 'number' || exp + SKEW_S < now / 1000) throw refused();
  return claims;
}

export interface AppleIdentity {
  /** Apple's stable id for this person in this team's apps. */
  readonly sub: string;
  /** The bundle id the token was made for. */
  readonly audience: string;
}

/** Checks an identity token from the phone and says who it is for. */
export async function verifyIdentityToken(token: string, now = Date.now()): Promise<AppleIdentity> {
  const claims = await verifyAppleJwt(token, APPLE_AUDIENCES, now);
  const sub = claims['sub'];
  if (typeof sub !== 'string' || sub.length === 0 || sub.length > 255) throw refused();
  return { sub, audience: claims['aud'] as string };
}
