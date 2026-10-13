import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';

import { hashDeviceToken } from '../src/device-auth';

import { appleJwt, serveAppleKeys, strangerKey } from './apple-stand-in';
import { call, registerDevice, wireErrorOf } from './support';
import { as, newPot, pairUp, rowsOf, signedIn, stateOf } from './together-support';

beforeEach(() => {
  serveAppleKeys();
});

const signIn = async (token: string, identityToken: string) =>
  call('/api/v1/together/sign-in', { method: 'POST', token, body: { identityToken } });

describe('signing in with Apple', () => {
  it('links the device to the person and keeps the name Apple sent', async () => {
    const token = await registerDevice();
    expect(await call('/api/v1/together', { token }).then((r) => r.json())).toEqual({
      me: null,
      pair: null,
    });
    const response = await call('/api/v1/together/sign-in', {
      method: 'POST',
      token,
      body: { identityToken: await appleJwt({ sub: 'apple-1' }), name: 'Linh' },
    });
    expect(response.status).toBe(200);
    const state = await stateOf({ token, sub: 'apple-1' });
    expect(state.me?.name).toBe('Linh');
    expect(state.pair).toBeNull();

    // Signing in again without a name (Apple sends it once) keeps it; a second phone is the same person.
    const other = await registerDevice();
    expect((await signIn(other, await appleJwt({ sub: 'apple-1' }))).status).toBe(200);
    expect((await stateOf({ token: other, sub: 'apple-1' })).me).toEqual(state.me);
  });

  it.each([
    ['another app', { aud: 'com.example.other' }],
    ['another issuer', { iss: 'https://example.com' }],
    ['an expired token', { exp: Math.floor(Date.now() / 1000) - 3600 }],
  ])('refuses %s', async (_label, claims) => {
    const token = await registerDevice();
    const response = await signIn(token, await appleJwt({ sub: 'x', ...claims }));
    expect(response.status).toBe(403);
    expect((await wireErrorOf(response)).detail).toEqual({ reason: 'apple_refused' });
  });

  it('refuses a token signed with a key Apple never published, or none at all', async () => {
    const token = await registerDevice();
    const forged = await appleJwt({ sub: 'x' }, { key: await strangerKey() });
    expect((await signIn(token, forged)).status).toBe(403);
    const unknownKid = await appleJwt({ sub: 'x' }, { kid: 'nope' });
    expect((await signIn(token, unknownKid)).status).toBe(403);
    expect((await signIn(token, 'not.a.jwt-at-all-really')).status).toBe(403);
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

describe('deleting the account', () => {
  it('deletes the person, their pair for both, and every device link', async () => {
    const { a, b } = await pairUp();
    await newPot(a);
    const pairId = (await stateOf(a)).pair?.id ?? '';

    const response = await as(a, '/account', { method: 'DELETE' });
    expect(response.status).toBe(200);

    expect(await stateOf(a)).toEqual({ me: null, pair: null });
    expect((await stateOf(b)).pair).toBeNull();
    for (const table of ['together_members', 'together_pots', 'together_invites']) {
      expect(await rowsOf(table, pairId)).toBe(0);
    }
    const user = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM together_users WHERE apple_sub = ?',
    )
      .bind(a.sub)
      .first<{ n: number }>();
    expect(user?.n).toBe(0);
    // The anonymous device is untouched: the rest of 6pm needs no account.
    const device = await env.DB.prepare('SELECT 1 AS ok FROM devices WHERE token_hash = ?')
      .bind(await hashDeviceToken(a.token))
      .first();
    expect(device).not.toBeNull();
    // Deleting again answers the same.
    expect((await as(a, '/account', { method: 'DELETE' })).status).toBe(200);
  });

  it('happens when Apple says the person stopped using Sign in with Apple', async () => {
    const { a, b } = await pairUp();
    const payload = await appleJwt({
      aud: 'ai.sixpm.app',
      events: JSON.stringify({ type: 'consent-revoked', sub: a.sub, event_time: Date.now() }),
    });
    const response = await call('/api/v1/together/apple-events', {
      method: 'POST',
      body: { payload },
    });
    expect(response.status).toBe(200);
    expect((await stateOf(a)).me).toBeNull();
    expect((await stateOf(b)).pair).toBeNull();
  });

  it('ignores a notification Apple did not sign', async () => {
    const a = await signedIn();
    const payload = await appleJwt(
      { events: JSON.stringify({ type: 'account-delete', sub: a.sub }) },
      { key: await strangerKey() },
    );
    const response = await call('/api/v1/together/apple-events', {
      method: 'POST',
      body: { payload },
    });
    expect(response.status).toBe(403);
    expect((await stateOf(a)).me).not.toBeNull();
  });
});
