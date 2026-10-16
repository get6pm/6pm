import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';

import { MAX_POT_CONTRIBUTIONS, MAX_SHARED_POTS } from '@6pm/domain';

import { serveAppleKeys } from './apple-stand-in';
import { wireErrorOf } from './support';
import { as, contribute, newPot, potBody, rowsOf, signedIn, stateOf } from './together-support';

beforeEach(() => {
  serveAppleKeys();
});

const AT = '2026-10-13T00:00:00.000Z';

async function statusesAndReasons(responses: Response[]) {
  return Promise.all(
    responses.map(async (response) =>
      response.status === 200 ? 200 : (await wireErrorOf(response)).detail,
    ),
  );
}

describe('a pair’s pots', () => {
  it('never pass the cap when the last places are asked for at once', async () => {
    const a = await signedIn();
    await newPot(a);
    const pairId = (await stateOf(a)).pair?.id ?? '';
    await env.DB.batch(
      Array.from({ length: MAX_SHARED_POTS - 2 }, () =>
        env.DB.prepare(
          `INSERT INTO together_pots (id, pair_id, name, icon, hue, goal, created_by, created_at,
             updated_at) VALUES (?, ?, 'Pot', 'flight', 0, 1000, 'x', ?, ?)`,
        ).bind(crypto.randomUUID(), pairId, AT, AT),
      ),
    );

    const bodies = Array.from({ length: 4 }, () => potBody());
    const responses = await Promise.all(
      bodies.map((body) => as(a, '/pots', { method: 'POST', body })),
    );
    const outcomes = await statusesAndReasons(responses);
    expect(outcomes.filter((o) => o === 200)).toHaveLength(1);
    expect(outcomes.filter((o) => o !== 200)).toEqual(Array(3).fill({ reason: 'too_many' }));
    expect(await rowsOf('together_pots', pairId)).toBe(MAX_SHARED_POTS);

    // Sending the pot that got in again is still a retry, not a new pot.
    const kept = bodies[responses.findIndex((r) => r.status === 200)];
    expect((await as(a, '/pots', { method: 'POST', body: kept })).status).toBe(200);
    expect(await rowsOf('together_pots', pairId)).toBe(MAX_SHARED_POTS);
  });
});

describe('a pot’s contributions', () => {
  it('never pass the cap when the last places are asked for at once', async () => {
    const a = await signedIn();
    const potId = await newPot(a);
    const userId = (await stateOf(a)).me?.id ?? '';
    await env.DB.batch(
      Array.from({ length: MAX_POT_CONTRIBUTIONS - 1 }, () =>
        env.DB.prepare(
          'INSERT INTO together_contributions (id, pot_id, user_id, amount, added_at) VALUES (?, ?, ?, 1000, ?)',
        ).bind(crypto.randomUUID(), potId, userId, AT),
      ),
    );

    const attempts = await Promise.all(Array.from({ length: 3 }, () => contribute(a, potId, 500)));
    const outcomes = await statusesAndReasons(attempts.map((attempt) => attempt.response));
    expect(outcomes.filter((o) => o === 200)).toHaveLength(1);
    expect(outcomes.filter((o) => o !== 200)).toEqual(Array(2).fill({ reason: 'too_many' }));
    const count = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM together_contributions WHERE pot_id = ?',
    )
      .bind(potId)
      .first<{ n: number }>();
    expect(count?.n).toBe(MAX_POT_CONTRIBUTIONS);

    // The contribution that got in, sent again, is a retry and still answers.
    const kept = attempts.find((attempt) => attempt.response.status === 200);
    const again = await as(a, `/pots/${potId}/contributions`, {
      method: 'POST',
      body: { id: kept?.id, amount: 500 },
    });
    expect(again.status).toBe(200);
  });
});
