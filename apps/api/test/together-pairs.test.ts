import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';

import { MAX_SHARED_AMOUNT } from '@6pm/domain';

import { hashDeviceToken } from '../src/device-auth';

import { serveAppleKeys } from './apple-stand-in';
import { wireErrorOf } from './support';
import {
  as,
  contribute,
  invite,
  newPot,
  pairUp,
  potBody,
  rowsOf,
  signedIn,
  stateOf,
} from './together-support';

beforeEach(() => {
  serveAppleKeys();
});

const accept = (person: Parameters<typeof as>[0], code: string) =>
  as(person, `/invites/${code}/accept`, { method: 'POST' });

describe('invites', () => {
  it('pairs two people who then see the same pots and who added what', async () => {
    const { a, b } = await pairUp();
    const potId = await newPot(a);
    expect((await contribute(a, potId, 500_000)).response.status).toBe(200);
    expect((await contribute(b, potId, 200_000)).response.status).toBe(200);
    const seenByA = await stateOf(a);
    const seenByB = await stateOf(b);
    expect(seenByA.pair).toEqual(seenByB.pair);
    expect(seenByA.pair?.members.map((m) => m.name)).toEqual(['An', 'Bình']);
    const pot = seenByA.pair?.pots[0];
    expect(pot?.contributions.map((c) => [c.memberId, c.amount])).toEqual([
      [seenByA.me?.id, 500_000],
      [seenByB.me?.id, 200_000],
    ]);
  });

  it('works once', async () => {
    const a = await signedIn();
    const code = await invite(a);
    expect((await accept(await signedIn(), code)).status).toBe(200);
    const late = await accept(await signedIn(), code);
    expect(late.status).toBe(409);
    expect((await wireErrorOf(late)).detail).toEqual({ reason: 'used' });
  });

  it('stops working once it expires', async () => {
    const a = await signedIn();
    const code = await invite(a);
    await env.DB.prepare('UPDATE together_invites SET expires_at = ? WHERE code_hash = ?')
      .bind(new Date(Date.now() - 1000).toISOString(), await hashDeviceToken(code))
      .run();
    const response = await accept(await signedIn(), code);
    expect(response.status).toBe(409);
    expect((await wireErrorOf(response)).detail).toEqual({ reason: 'expired' });
  });

  it('cannot be taken by its maker, guessed, or used on a pair of two', async () => {
    const a = await signedIn();
    const own = await accept(a, await invite(a));
    expect((await wireErrorOf(own)).detail).toEqual({ reason: 'own' });
    expect((await accept(a, 'AAAAAAAAAAAAAAAAAAAAAA')).status).toBe(404);
    expect((await accept(a, '../../pots')).status).toBe(404);

    const { a: full } = await pairUp();
    const more = await as(full, '/invites', { method: 'POST' });
    expect((await wireErrorOf(more)).detail).toEqual({ reason: 'full' });
  });

  it('lets one of two invites taken at once through, and refuses the other without a server error', async () => {
    const joiner = await signedIn();
    const codes = await Promise.all([invite(await signedIn()), invite(await signedIn())]);
    const answers = await Promise.all(codes.map((code) => accept(joiner, code)));
    expect(answers.map((r) => r.status).sort()).toEqual([200, 409]);
    const refused = answers.find((r) => r.status === 409);
    if (refused) expect((await wireErrorOf(refused)).detail).toEqual({ reason: 'paired' });
    expect((await stateOf(joiner)).pair?.members).toHaveLength(2);
  });

  it('replaces an untaken invite with the next one', async () => {
    const a = await signedIn();
    const first = await invite(a);
    await invite(a);
    expect((await accept(await signedIn(), first)).status).toBe(404);
  });

  it('asks someone already sharing to leave first, and lets an empty pair go', async () => {
    const { a } = await pairUp();
    const code = await invite(await signedIn());
    expect((await wireErrorOf(await accept(a, code))).detail).toEqual({ reason: 'paired' });

    const alone = await signedIn();
    await invite(alone); // a pair of one, nothing in it
    expect((await accept(alone, code)).status).toBe(200);
    expect((await stateOf(alone)).pair?.members).toHaveLength(2);
  });
});

describe('who can touch what', () => {
  it('keeps one pair out of another pair’s pots and money', async () => {
    const { a } = await pairUp();
    const potId = await newPot(a);
    const { id: entry } = await contribute(a, potId, 100_000);
    const { a: stranger } = await pairUp();

    const { id: _ignored, ...fields } = potBody();
    expect((await as(stranger, `/pots/${potId}`, { method: 'PUT', body: fields })).status).toBe(
      404,
    );
    expect((await contribute(stranger, potId, 100_000)).response.status).toBe(404);
    expect((await as(stranger, `/pots/${potId}`, { method: 'DELETE' })).status).toBe(200);
    expect((await as(stranger, `/contributions/${entry}`, { method: 'DELETE' })).status).toBe(200);
    // A pot id another pair holds cannot be claimed either.
    const claim = await as(stranger, '/pots', { method: 'POST', body: potBody({ id: potId }) });
    expect(claim.status).toBe(404);

    const pot = (await stateOf(a)).pair?.pots[0];
    expect(pot?.name).toBe('Đà Lạt trip');
    expect(pot?.contributions).toHaveLength(1);
    expect((await stateOf(stranger)).pair?.pots).toEqual([]);
  });

  it('lets each partner take back only their own contribution', async () => {
    const { a, b } = await pairUp();
    const potId = await newPot(a);
    const { id: mine } = await contribute(a, potId, 300_000);
    await as(b, `/contributions/${mine}`, { method: 'DELETE' });
    expect((await stateOf(a)).pair?.pots[0]?.contributions).toHaveLength(1);
    await as(a, `/contributions/${mine}`, { method: 'DELETE' });
    expect((await stateOf(a)).pair?.pots[0]?.contributions).toHaveLength(0);
  });

  it('lets either partner edit or delete a shared pot', async () => {
    const { a, b } = await pairUp();
    const potId = await newPot(a);
    const edit = await as(b, `/pots/${potId}`, {
      method: 'PUT',
      body: { name: 'Phú Quốc', icon: 'beach_access', hue: 200, goal: 5_000_000, neededBy: null },
    });
    expect(edit.status).toBe(200);
    expect((await stateOf(a)).pair?.pots[0]).toMatchObject({ name: 'Phú Quốc', goal: 5_000_000 });
    await as(b, `/pots/${potId}`, { method: 'DELETE' });
    expect((await stateOf(a)).pair?.pots).toEqual([]);
  });
});

describe('money', () => {
  it.each([0, -5, 1000.5, '100000', MAX_SHARED_AMOUNT + 1, null])(
    'refuses %s as an amount',
    async (amount) => {
      const a = await signedIn();
      const potId = await newPot(a);
      const response = await as(a, `/pots/${potId}/contributions`, {
        method: 'POST',
        body: { id: crypto.randomUUID(), amount },
      });
      expect(response.status).toBe(400);
    },
  );

  it('keeps a pot in its maker’s currency, and in đồng when a phone names none', async () => {
    const a = await signedIn();
    const inDong = await newPot(a);
    const inDollars = await newPot(a, { goal: 300_000, currency: 'USD' });
    await contribute(a, inDollars, 2_500);
    const edit = await as(a, `/pots/${inDollars}`, {
      method: 'PUT',
      body: { name: 'Hawaii', icon: 'flight', hue: 200, goal: 400_000, neededBy: null },
    });
    expect(edit.status).toBe(200);
    const pots = (await stateOf(a)).pair?.pots ?? [];
    expect(pots.find((p) => p.id === inDong)?.currency).toBe('VND');
    expect(pots.find((p) => p.id === inDollars)).toMatchObject({
      currency: 'USD',
      goal: 400_000,
      contributions: [{ amount: 2_500 }],
    });
  });

  it.each(['usd', 'US', 'DOLLAR', 840])('refuses %s as a currency', async (currency) => {
    const a = await signedIn();
    const response = await as(a, '/pots', { method: 'POST', body: potBody({ currency }) });
    expect(response.status).toBe(400);
  });

  it('never moves a pot to another currency on an edit', async () => {
    const a = await signedIn();
    const potId = await newPot(a);
    const { id, ...fields } = potBody({ currency: 'USD' });
    expect(id).not.toBe(potId);
    const edit = await as(a, `/pots/${potId}`, { method: 'PUT', body: fields });
    expect(edit.status).toBe(400);
    expect((await stateOf(a)).pair?.pots[0]?.currency).toBe('VND');
  });

  it('refuses a goal that is not whole minor units', async () => {
    const a = await signedIn();
    const response = await as(a, '/pots', { method: 'POST', body: potBody({ goal: 2_500_000.5 }) });
    expect(response.status).toBe(400);
  });

  it('adds a retried contribution once', async () => {
    const a = await signedIn();
    const potId = await newPot(a);
    const body = { id: crypto.randomUUID(), amount: 150_000 };
    await as(a, `/pots/${potId}/contributions`, { method: 'POST', body });
    await as(a, `/pots/${potId}/contributions`, { method: 'POST', body });
    expect((await stateOf(a)).pair?.pots[0]?.contributions).toHaveLength(1);
  });
});

describe('leaving', () => {
  it('deletes the shared copy for both partners, and the sign-in stays', async () => {
    const { a, b } = await pairUp();
    const potId = await newPot(a);
    await contribute(a, potId, 100_000);
    await contribute(b, potId, 100_000);
    const pairId = (await stateOf(a)).pair?.id ?? '';

    expect((await as(b, '/leave', { method: 'POST' })).status).toBe(200);

    expect((await stateOf(a)).pair).toBeNull();
    expect((await stateOf(b)).pair).toBeNull();
    expect((await stateOf(b)).me).not.toBeNull();
    for (const table of ['together_members', 'together_pots', 'together_invites']) {
      expect(await rowsOf(table, pairId)).toBe(0);
    }
    const left = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM together_contributions WHERE pot_id = ?',
    )
      .bind(potId)
      .first<{ n: number }>();
    expect(left?.n).toBe(0);
    // Leaving again answers the same.
    expect((await as(a, '/leave', { method: 'POST' })).status).toBe(200);
  });
});
