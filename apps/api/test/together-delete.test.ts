import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';

import { hashDeviceToken } from '../src/device-auth';

import { appleNotification, serveAppleKeys, strangerKey } from './apple-stand-in';
import { call } from './support';
import { as, newPot, pairUp, rowsOf, signedIn, stateOf } from './together-support';

beforeEach(() => {
  serveAppleKeys();
});

const notify = (payload: string) =>
  call('/api/v1/together/apple-events', { method: 'POST', body: { payload } });

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
});

describe("Apple's notifications", () => {
  it('delete the account on consent-revoked, in the shape Apple documents (no exp)', async () => {
    const { a, b } = await pairUp();
    const response = await notify(await appleNotification({ type: 'consent-revoked', sub: a.sub }));
    expect(response.status).toBe(200);
    expect((await stateOf(a)).me).toBeNull();
    expect((await stateOf(b)).pair).toBeNull();
  });

  it('delete the account on account-delete', async () => {
    const a = await signedIn();
    await notify(await appleNotification({ type: 'account-delete', sub: a.sub }));
    expect((await stateOf(a)).me).toBeNull();
  });

  it('acknowledge other events and change nothing', async () => {
    const a = await signedIn();
    const response = await notify(await appleNotification({ type: 'email-disabled', sub: a.sub }));
    expect(response.status).toBe(200);
    expect((await stateOf(a)).me).not.toBeNull();
  });

  it('are refused when Apple did not sign them', async () => {
    const a = await signedIn();
    const payload = await appleNotification(
      { type: 'account-delete', sub: a.sub },
      { key: await strangerKey() },
    );
    expect((await notify(payload)).status).toBe(403);
    expect((await stateOf(a)).me).not.toBeNull();
  });

  it('are refused once more than an hour old, or dated ahead', async () => {
    const a = await signedIn();
    const now = Math.floor(Date.now() / 1000);
    for (const iat of [now - 2 * 60 * 60, now + 10 * 60]) {
      const payload = await appleNotification({ type: 'consent-revoked', sub: a.sub }, { iat });
      expect((await notify(payload)).status).toBe(403);
    }
    expect((await stateOf(a)).me).not.toBeNull();
  });

  it('are acted on once: a replay cannot delete someone who signed in again', async () => {
    const first = await signedIn();
    const jti = crypto.randomUUID();
    const payload = await appleNotification({ type: 'consent-revoked', sub: first.sub }, { jti });
    expect((await notify(payload)).status).toBe(200);
    expect((await stateOf(first)).me).toBeNull();

    // The same person signs in again; the old notification is sent again.
    const again = await signedIn();
    await env.DB.prepare('UPDATE together_users SET apple_sub = ? WHERE id = ?')
      .bind(first.sub, (await stateOf(again)).me?.id ?? '')
      .run();
    expect((await notify(payload)).status).toBe(200);
    expect((await stateOf(again)).me).not.toBeNull();
  });

  it('ignore an event from before the person signed up again', async () => {
    const a = await signedIn();
    const payload = await appleNotification({
      type: 'consent-revoked',
      sub: a.sub,
      event_time: Date.now() - 60 * 60 * 1000,
    });
    expect((await notify(payload)).status).toBe(200);
    expect((await stateOf(a)).me).not.toBeNull();
  });
});
