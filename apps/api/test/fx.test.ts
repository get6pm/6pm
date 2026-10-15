import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';

import { FX_CURRENCY_CODES, fxRatesResponseSchema, TRAVEL_CURRENCY_CODES } from '@6pm/domain';

import { FrankfurterError, fetchRates, plainDecimal } from '../src/fx/frankfurter';
import {
  createD1FxSnapshotWriter,
  currenciesForRun,
  FX_RUN_EVERY_MS,
  ingestFxSnapshots,
} from '../src/fx/ingest';
import { readLatestRates } from '../src/fx/latest-rates';

import { call, registerDevice, wireErrorOf } from './support';

/** A Frankfurter stand-in: answers each `base` from the table, counting the calls. */
function frankfurter(answers: Record<string, string | number>) {
  const calls: string[] = [];
  const fetchImpl = ((input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const base = url.searchParams.get('base') ?? '';
    calls.push(base);
    const answer = answers[base];
    if (typeof answer === 'number')
      return Promise.resolve(new Response('nope', { status: answer }));
    if (answer === undefined) return Promise.resolve(Response.json([]));
    return Promise.resolve(
      new Response(answer, { headers: { 'Content-Type': 'application/json' } }),
    );
  }) as typeof fetch;
  return { fetchImpl, calls };
}

const body = (base: string, rate: string, date = '2026-10-12') =>
  `[{"date":"${date}","base":"${base}","quote":"VND","rate":${rate}}]`;

const now = new Date('2026-10-12T12:00:00Z');

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM fx_snapshots').run();
});

describe('reading Frankfurter', () => {
  it('keeps each rate exactly as sent, beyond what a float holds', async () => {
    const { fetchImpl } = frankfurter({ THB: body('THB', '770.123456789012345') });
    const [rate] = await fetchRates({ base: 'THB', quotes: ['VND'] }, { fetchImpl });
    expect(rate).toEqual({
      date: '2026-10-12',
      base: 'THB',
      quote: 'VND',
      rate: '770.123456789012345',
    });
  });

  it('writes an exponent as a plain decimal', () => {
    expect(plainDecimal('6.9e-05')).toBe('0.000069');
    expect(plainDecimal('2.5853E4')).toBe('25853');
    expect(plainDecimal('1e3')).toBe('1000');
    expect(plainDecimal('770.17')).toBe('770.17');
  });

  it('retries a server failure and gives up at once on a bad request', async () => {
    const flaky = frankfurter({ THB: 503 });
    await expect(
      fetchRates({ base: 'THB', quotes: ['VND'] }, { fetchImpl: flaky.fetchImpl, retries: 2 }),
    ).rejects.toBeInstanceOf(FrankfurterError);
    expect(flaky.calls).toHaveLength(3);

    const bad = frankfurter({ XXX: 422 });
    await expect(
      fetchRates({ base: 'XXX', quotes: ['VND'] }, { fetchImpl: bad.fetchImpl, retries: 2 }),
    ).rejects.toMatchObject({ retryable: false, status: 422 });
    expect(bad.calls).toHaveLength(1);
  });

  it('refuses a body of the wrong shape without retrying', async () => {
    const { fetchImpl, calls } = frankfurter({ THB: '{"rates":{}}' });
    await expect(fetchRates({ base: 'THB', quotes: ['VND'] }, { fetchImpl })).rejects.toMatchObject(
      {
        retryable: false,
      },
    );
    expect(calls).toHaveLength(1);
  });
});

describe('the scheduled ingest', () => {
  const writer = () => createD1FxSnapshotWriter(env.DB, () => now);

  it('stores each currency once, however often it runs', async () => {
    const { fetchImpl } = frankfurter({ THB: body('THB', '770.17'), JPY: body('JPY', '163.22') });
    const options = { fetchImpl, now, currencies: ['THB', 'JPY'] };
    const first = await ingestFxSnapshots(writer(), options);
    expect(first).toMatchObject({
      fetched: 2,
      inserted: 2,
      skipped: 0,
      rejected: [],
      stale: false,
    });
    const again = await ingestFxSnapshots(writer(), options);
    expect(again).toMatchObject({ inserted: 0, skipped: 2 });
    const { results } = await env.DB.prepare(
      'SELECT base, rate FROM fx_snapshots ORDER BY base',
    ).all();
    expect(results).toEqual([
      { base: 'JPY', rate: '163.22' },
      { base: 'THB', rate: '770.17' },
    ]);
  });

  it('reports a currency that fails and still stores the rest', async () => {
    const { fetchImpl } = frankfurter({ THB: body('THB', '770.17'), KHR: 422, LAK: '[]' });
    const result = await ingestFxSnapshots(writer(), {
      fetchImpl,
      now,
      retries: 0,
      currencies: ['KHR', 'THB', 'LAK'],
    });
    expect(result.inserted).toBe(1);
    expect(result.rejected.map((r) => r.base)).toEqual(['KHR', 'LAK']);
    expect(result.rejected[1]?.reason).toBe('no_vnd_rate');
  });

  it('says when even the freshest rate is stale', async () => {
    const { fetchImpl } = frankfurter({ THB: body('THB', '770.17', '2026-10-09') });
    const result = await ingestFxSnapshots(writer(), { fetchImpl, now, currencies: ['THB'] });
    expect(result).toMatchObject({ latestAsOf: '2026-10-09', stale: true });
  });

  it('asks for every travel currency against the đồng by default', async () => {
    const { fetchImpl, calls } = frankfurter({});
    const result = await ingestFxSnapshots(writer(), { fetchImpl, now });
    expect(calls).toEqual(expect.arrayContaining([...TRAVEL_CURRENCY_CODES]));
    expect(calls).toEqual(currenciesForRun(now));
    expect(result.stale).toBe(true);
  });

  it('asks for the rest of the currency table in turns, two runs covering all of it', () => {
    const first = currenciesForRun(now);
    const next = currenciesForRun(new Date(now.getTime() + FX_RUN_EVERY_MS));
    for (const run of [first, next]) {
      expect(run.slice(0, TRAVEL_CURRENCY_CODES.length)).toEqual(TRAVEL_CURRENCY_CODES);
      expect(run.length).toBeLessThanOrEqual(45);
    }
    expect(new Set([...first, ...next])).toEqual(new Set(FX_CURRENCY_CODES));
    expect(first.filter((code) => next.includes(code))).toEqual(TRAVEL_CURRENCY_CODES);
    expect(first).not.toContain('VND');
  });

  it('stores a currency for a home outside Vietnam the way it stores the baht', async () => {
    const { fetchImpl } = frankfurter({
      CAD: body('CAD', '18712'),
      IRR: body('IRR', '0.01469'),
      KWD: body('KWD', '83494'),
    });
    const options = { fetchImpl, now, currencies: ['CAD', 'IRR', 'KWD', 'BGN'] };
    const result = await ingestFxSnapshots(writer(), options);
    expect(result).toMatchObject({
      inserted: 3,
      rejected: [{ base: 'BGN', reason: 'no_vnd_rate' }],
    });
    const answer = await readLatestRates(env.DB, now);
    expect(answer.rates.map(({ currency, rate }) => [currency, rate])).toEqual([
      ['CAD', '18712'],
      ['IRR', '0.01469'],
      ['KWD', '83494'],
    ]);
  });
});

describe('GET /v1/fx', () => {
  const seed = async (rows: [string, string, string][]) => {
    for (const [base, rate, asOf] of rows) {
      await env.DB.prepare(
        `INSERT INTO fx_snapshots (base, quote, rate, as_of, source, created_at)
         VALUES (?, 'VND', ?, ?, 'frankfurter', ?)`,
      )
        .bind(base, rate, asOf, now.toISOString())
        .run();
    }
  };

  it('needs a registered device', async () => {
    const response = await call('/api/v1/fx');
    expect(response.status).toBe(401);
    expect(await wireErrorOf(response)).toMatchObject({ code: 'unauthorized' });
  });

  it('answers the newest rate of each currency, exactly, with its date', async () => {
    await seed([
      ['THB', '760.5', '2026-10-09'],
      ['THB', '770.17', '2026-10-12'],
      ['JPY', '163.22', '2026-10-11'],
    ]);
    const token = await registerDevice();
    const response = await call('/api/v1/fx', { token });
    expect(response.status).toBe(200);
    const answer = fxRatesResponseSchema.parse(await response.json());
    expect(answer.rates).toEqual([
      { currency: 'JPY', rate: '163.22', asOf: '2026-10-11', source: 'frankfurter' },
      { currency: 'THB', rate: '770.17', asOf: '2026-10-12', source: 'frankfurter' },
    ]);
    expect(answer.asOf).toBe('2026-10-12');
    expect(answer.snapshotId).not.toBeNull();
  });

  it('says stale when the newest rate is over two days old, and when there is none', async () => {
    const empty = await readLatestRates(env.DB, now);
    expect(empty).toEqual({ snapshotId: null, asOf: null, stale: true, rates: [] });
    await seed([['THB', '770.17', '2026-10-09']]);
    expect((await readLatestRates(env.DB, now)).stale).toBe(true);
    await seed([['THB', '771', '2026-10-11']]);
    expect((await readLatestRates(env.DB, now)).stale).toBe(false);
  });

  it('answers the rates of a day: the newest on or before it, else the newest', async () => {
    await seed([
      ['IDR', '1.55', '2026-08-28'],
      ['IDR', '1.6', '2026-09-01'],
      ['IDR', '1.62', '2026-09-03'],
      ['THB', '770.17', '2026-10-12'],
    ]);
    const token = await registerDevice();
    const response = await call('/api/v1/fx?on=2026-09-02', { token });
    expect(response.status).toBe(200);
    const answer = fxRatesResponseSchema.parse(await response.json());
    expect(answer.rates.map(({ currency, rate, asOf }) => [currency, rate, asOf])).toEqual([
      ['IDR', '1.6', '2026-09-01'],
      ['THB', '770.17', '2026-10-12'],
    ]);
    const before = await readLatestRates(env.DB, now, '2026-08-01');
    expect(before.rates.find((r) => r.currency === 'IDR')?.rate).toBe('1.62');
  });

  it('says a day’s rates are stale only when they are old for that day', async () => {
    await seed([['IDR', '1.6', '2026-09-01']]);
    expect((await readLatestRates(env.DB, now, '2026-09-02')).stale).toBe(false);
    expect((await readLatestRates(env.DB, now, '2026-09-20')).stale).toBe(true);
  });

  it('refuses a day that is not one', async () => {
    const token = await registerDevice();
    for (const on of ['yesterday', '2026-13-45', '2026-9-2']) {
      const response = await call(`/api/v1/fx?on=${on}`, { token });
      expect(response.status).toBe(400);
    }
  });
});
