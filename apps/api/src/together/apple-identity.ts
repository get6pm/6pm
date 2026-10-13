import { ApiError } from '../errors';

/**
 * Sign in with Apple, checked on the server. Apple signs two kinds of JWT with the keys it
 * publishes: the identity token the phone gets at sign-in, and the server-to-server notifications.
 * Both must be signed by Apple, issued by Apple and made for one of the 6pm apps. An identity
 * token must also be unexpired and carry the hash of a nonce this server handed out; a
 * notification has no `exp`, so it must be recent instead, and each one is taken once.
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
/** A notification older than this is refused: Apple sends them as events happen. */
export const NOTIFICATION_MAX_AGE_S = 60 * 60;
/** A token naming a key not in the set fetches the set again at most this often. */
const REFETCH_COOLDOWN_MS = 60 * 1000;

type AppleJwk = JsonWebKey & { kid: string };
let cached: { keys: AppleJwk[]; at: number } | null = null;
let lastRefetch = Number.NEGATIVE_INFINITY;

/** Forgets Apple's keys, so the next check fetches them again. */
export function forgetAppleKeys(): void {
  cached = null;
  lastRefetch = Number.NEGATIVE_INFINITY;
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

/**
 * The claims of a JWT that Apple signed and issued for one of the 6pm apps, or a `forbidden`
 * error. Time is left to the callers: identity tokens and notifications check it differently.
 */
async function verifyAppleSigned(token: string, now: number): Promise<Record<string, unknown>> {
  const parts = token.split('.');
  if (parts.length !== 3) throw refused();
  const [head = '', body = '', signature = ''] = parts;
  const header = jsonPart(head);
  const claims = jsonPart(body);
  if (header === null || claims === null) throw refused();
  if (header['alg'] !== 'RS256' || typeof header['kid'] !== 'string') throw refused();
  const kid = header['kid'];

  let jwk = (await appleKeys(false, now)).find((k) => k.kid === kid);
  // A key Apple has only just published: fetch the set again, but not for every unknown key.
  if (jwk === undefined && now - lastRefetch >= REFETCH_COOLDOWN_MS) {
    lastRefetch = now;
    jwk = (await appleKeys(true, now)).find((k) => k.kid === kid);
  }
  if (jwk === undefined) throw refused();

  if (!(await signedBy(jwk, `${head}.${body}`, signature))) throw refused();

  const aud = claims['aud'];
  if (claims['iss'] !== APPLE_ISSUER) throw refused();
  if (typeof aud !== 'string' || !(APPLE_AUDIENCES as readonly string[]).includes(aud)) {
    throw refused();
  }
  return claims;
}

/** SHA-256 of a text, lowercase hex: how the phone hands the nonce to Apple. */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export interface AppleIdentity {
  /** Apple's stable id for this person in this team's apps. */
  readonly sub: string;
  /** The bundle id the token was made for. */
  readonly audience: string;
}

/**
 * Checks an identity token from the phone and says who it is for. The token must carry the
 * SHA-256 of `nonce`, the raw nonce the phone was given by this server for this sign-in.
 */
export async function verifyIdentityToken(
  token: string,
  nonce: string,
  now = Date.now(),
): Promise<AppleIdentity> {
  const claims = await verifyAppleSigned(token, now);
  const exp = claims['exp'];
  if (typeof exp !== 'number' || exp + SKEW_S < now / 1000) throw refused();
  if (claims['nonce'] !== (await sha256Hex(nonce))) throw refused();
  const sub = claims['sub'];
  if (typeof sub !== 'string' || sub.length === 0 || sub.length > 255) throw refused();
  return { sub, audience: claims['aud'] as string };
}

export interface AppleNotification {
  /** Apple's id for this notification: taken once. */
  readonly jti: string;
  /** The `events` claim, still to be read. */
  readonly events: unknown;
}

/**
 * Checks a server-to-server notification. Apple's carry `iss`, `aud`, `iat`, `jti` and `events`
 * and no `exp`: one is taken only while it is recent (`iat` within the hour, not ahead of us).
 */
export async function verifyAppleNotification(
  payload: string,
  now = Date.now(),
): Promise<AppleNotification> {
  const claims = await verifyAppleSigned(payload, now);
  const iat = claims['iat'];
  const jti = claims['jti'];
  const seconds = now / 1000;
  if (typeof iat !== 'number' || iat > seconds + SKEW_S || iat < seconds - NOTIFICATION_MAX_AGE_S) {
    throw refused();
  }
  if (typeof jti !== 'string' || jti.length === 0 || jti.length > 255) throw refused();
  return { jti, events: claims['events'] };
}
