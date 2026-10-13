import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';

import { sha256Hex } from '../src/together/apple-identity';

import { appleJwt, keyFetches, serveAppleKeys, strangerKey } from './apple-stand-in';
import { call, registerDevice, wireErrorOf } from './support';
import { ensurePair } from '../src/together/store';
import { as, nonceFor, signedIn, signInBody, stateOf } from './together-support';

beforeEach(() => {
  serveAppleKeys();
});

const signIn = async (token: string, body: Record<string, unknown>) =>
  call('/api/v1/together/sign-in', { method: 'POST', token, body });

const refusal = async (response: Response) => {
  expect(response.status).toBe(403);
  expect((await wireErrorOf(response)).detail).toEqual({ reason: 'apple_refused' });
};

describe('signing in with Apple', () => {
  it('links the device to the person and keeps the name Apple sent', async () => {
    const token = await registerDevice();
    expect(await call('/api/v1/together', { token }).then((r) => r.json())).toEqual({
      me: null,
      pair: null,
    });
    const response = await signIn(token, {
      ...(await signInBody('apple-1', await nonceFor(token))),
      name: 'Linh',
    });
    expect(response.status).toBe(200);
    const state = await stateOf({ token, sub: 'apple-1' });
    expect(state.me?.name).toBe('Linh');
    expect(state.pair).toBeNull();

    // Signing in again without a name (Apple sends it once) keeps it; a second phone is the same person.
    const other = await registerDevice();
    expect((await signIn(other, await signInBody('apple-1', await nonceFor(other)))).status).toBe(
      200,
    );
    expect((await stateOf({ token: other, sub: 'apple-1' })).me).toEqual(state.me);
  });

  it.each([
    ['another app', { aud: 'com.example.other' }],
    ['another issuer', { iss: 'https://example.com' }],
    ['an expired token', { exp: Math.floor(Date.now() / 1000) - 3600 }],
  ])('refuses %s', async (_label, claims) => {
    const token = await registerDevice();
    await refusal(await signIn(token, await signInBody('x', await nonceFor(token), claims)));
  });

  it('refuses a token signed with a key Apple never published, or none at all', async () => {
    const token = await registerDevice();
    const nonce = await nonceFor(token);
    const claims = { sub: 'x', nonce: await sha256Hex(nonce) };
    await refusal(
      await signIn(token, {
        identityToken: await appleJwt(claims, { key: await strangerKey() }),
        nonce,
      }),
    );
    await refusal(
      await signIn(token, { identityToken: await appleJwt(claims, { kid: 'nope' }), nonce }),
    );
    await refusal(await signIn(token, { identityToken: 'not.a.jwt-at-all-really', nonce }));
  });

  it('turns away every shared route until the phone signs in', async () => {
    const token = await registerDevice();
    for (const [method, path] of [
      ['POST', '/invites'],
      ['POST', '/pots'],
      ['POST', '/leave'],
    ] as const) {
      const response = await call(`/api/v1/together${path}`, {
        method,
        token,
        body: {
          id: crypto.randomUUID(),
          name: 'x',
          icon: 'flight',
          hue: 1,
          goal: 1,
          neededBy: null,
        },
      });
      expect(response.status).toBe(403);
      expect((await wireErrorOf(response)).detail).toEqual({ reason: 'signed_out' });
    }
    // And with no device token at all, nothing.
    expect((await call('/api/v1/together')).status).toBe(401);
  });
});

describe('the sign-in nonce', () => {
  it('is required, and must be the one the token was made for', async () => {
    const token = await registerDevice();
    const nonce = await nonceFor(token);
    // No nonce at all: the body does not match.
    expect(
      (await signIn(token, { identityToken: await appleJwt({ sub: 'x', nonce: 'a' }) })).status,
    ).toBe(400);
    // A token with no nonce claim, or a different one.
    await refusal(await signIn(token, { identityToken: await appleJwt({ sub: 'x' }), nonce }));
    const other = await nonceFor(token);
    await refusal(
      await signIn(token, {
        identityToken: await appleJwt({ sub: 'x', nonce: await sha256Hex(other) }),
        nonce,
      }),
    );
  });

  it('works once, so a token cannot be replayed', async () => {
    const token = await registerDevice();
    const body = await signInBody('replayed', await nonceFor(token));
    expect((await signIn(token, body)).status).toBe(200);
    await refusal(await signIn(token, body));
  });

  it('works only from the device it was handed to', async () => {
    const mine = await registerDevice();
    const thief = await registerDevice();
    await refusal(await signIn(thief, await signInBody('x', await nonceFor(mine))));
  });

  it('stops working after ten minutes', async () => {
    const token = await registerDevice();
    const nonce = await nonceFor(token);
    await env.DB.prepare('UPDATE together_nonces SET expires_at = ? WHERE nonce_hash = ?')
      .bind(new Date(Date.now() - 1000).toISOString(), await sha256Hex(nonce))
      .run();
    await refusal(await signIn(token, await signInBody('x', nonce)));
  });
});

describe("Apple's keys", () => {
  it('are fetched again for an unknown key at most once a minute', async () => {
    const token = await registerDevice();
    const tryUnknown = async () => {
      const nonce = await nonceFor(token);
      const identityToken = await appleJwt(
        { sub: 'x', nonce: await sha256Hex(nonce) },
        { kid: `unknown-${crypto.randomUUID()}` },
      );
      await refusal(await signIn(token, { identityToken, nonce }));
    };
    await tryUnknown();
    const afterFirst = keyFetches.count;
    await tryUnknown();
    await tryUnknown();
    expect(keyFetches.count).toBe(afterFirst);
  });
});

describe('racing requests', () => {
  it('make one pair for a person, not a server error', async () => {
    const a = await signedIn();
    const user = await env.DB.prepare('SELECT id FROM together_users WHERE apple_sub = ?')
      .bind(a.sub)
      .first<{ id: string }>();
    const ids = await Promise.all([1, 2, 3].map(() => ensurePair(env.DB, user?.id ?? '')));
    expect(new Set(ids).size).toBe(1);
    expect((await stateOf(a)).pair?.id).toBe(ids[0]);
  });

  it('answer every concurrent pot and invite without a server error', async () => {
    const a = await signedIn();
    const answers = await Promise.all([
      as(a, '/invites', { method: 'POST' }),
      as(a, '/invites', { method: 'POST' }),
    ]);
    for (const r of answers) expect(r.status).toBeLessThan(500);
    expect((await stateOf(a)).pair?.members).toHaveLength(1);
  });
});
