import {
  FX_CURRENCY_CODES,
  FX_STALE_HOURS,
  isFxStale,
  isRate,
  TRAVEL_CURRENCY_CODES,
} from '@6pm/domain';

import { fetchRates, type FrankfurterClientOptions } from './frankfurter';

export const FX_SOURCE = 'frankfurter';
/** Every rate is stored against the đồng: đồng for one unit of the currency. */
export const FX_QUOTE = 'VND';

export interface FxSnapshotRow {
  readonly base: string;
  readonly quote: string;
  readonly rate: string;
  readonly asOf: string;
  readonly source: string;
}

export interface FxSnapshotWriter {
  /** Idempotent: `inserted: false` means the row was already there and was left as it was. */
  upsertSnapshot(row: FxSnapshotRow): Promise<{ readonly inserted: boolean }>;
}

export interface RejectedRate {
  readonly base: string;
  readonly reason: string;
}

export interface IngestResult {
  readonly fetched: number;
  readonly inserted: number;
  readonly skipped: number;
  readonly rejected: readonly RejectedRate[];
  readonly latestAsOf: string | null;
  /** The freshest rate fetched is still older than the staleness threshold. */
  readonly stale: boolean;
}

export interface IngestOptions extends FrankfurterClientOptions {
  readonly now?: Date;
  readonly staleThresholdHours?: number;
  /** Default: this run's share of every currency (`currenciesForRun`). */
  readonly currencies?: readonly string[];
}

/** How often the cron in `wrangler.jsonc` runs. */
export const FX_RUN_EVERY_MS = 6 * 60 * 60 * 1000;
/** The other currencies are asked for every this many runs: twice a day at four runs a day. */
const REST_EVERY_RUNS = 2;

/**
 * The currencies a run asks for. Frankfurter takes one base per request, so a run costs one
 * request per currency: every run asks for the travel currencies, and the rest of the table in
 * turns (half each run), so a run stays near forty requests, well inside a Worker's limit on
 * outgoing requests, and each rate is still at most half a day old (stale is two days).
 */
export function currenciesForRun(now: Date): readonly string[] {
  const run = Math.floor(now.getTime() / FX_RUN_EVERY_MS);
  const turn = ((run % REST_EVERY_RUNS) + REST_EVERY_RUNS) % REST_EVERY_RUNS;
  const rest = FX_CURRENCY_CODES.filter((code) => !TRAVEL_CURRENCY_CODES.includes(code));
  return [...TRAVEL_CURRENCY_CODES, ...rest.filter((_, i) => i % REST_EVERY_RUNS === turn)];
}

/**
 * Fetches each currency's rate in đồng and stores it once, so any home currency converts to any
 * other through two đồng quotes. Frankfurter is asked one base at a time (`base=THB&quotes=VND`)
 * and the rate is kept exactly as it sent it: asking once with the đồng as the base would come
 * back with two or three significant digits, and dividing one dollar-based set would store a
 * figure Frankfurter never published. A currency that fails, or comes back without a usable
 * đồng rate (Frankfurter has none for the lev since Bulgaria took the euro), is reported in
 * `rejected` and never stops the others.
 */
export async function ingestFxSnapshots(
  writer: FxSnapshotWriter,
  options: IngestOptions = {},
): Promise<IngestResult> {
  const now = options.now ?? new Date();
  const currencies = options.currencies ?? currenciesForRun(now);
  let fetched = 0;
  let inserted = 0;
  let skipped = 0;
  let latestAsOf: string | null = null;
  const rejected: RejectedRate[] = [];

  for (const base of currencies) {
    let rates;
    try {
      rates = await fetchRates({ base, quotes: [FX_QUOTE] }, options);
    } catch (error) {
      rejected.push({ base, reason: error instanceof Error ? error.message : 'fetch failed' });
      continue;
    }
    fetched += rates.length;
    const rate = rates.find((r) => r.base === base && r.quote === FX_QUOTE);
    if (rate === undefined || !isRate(rate.rate)) {
      rejected.push({ base, reason: rate === undefined ? 'no_vnd_rate' : 'unusable_rate' });
      continue;
    }
    const result = await writer.upsertSnapshot({
      base,
      quote: FX_QUOTE,
      rate: rate.rate,
      asOf: rate.date,
      source: FX_SOURCE,
    });
    if (result.inserted) inserted += 1;
    else skipped += 1;
    if (latestAsOf === null || rate.date > latestAsOf) latestAsOf = rate.date;
  }

  const stale =
    latestAsOf === null ||
    isFxStale(latestAsOf, now, options.staleThresholdHours ?? FX_STALE_HOURS);
  return { fetched, inserted, skipped, rejected, latestAsOf, stale };
}

/** The D1 writer. `DO NOTHING`, not `DO UPDATE`: a stored rate is a fact a spend may point at. */
export function createD1FxSnapshotWriter(db: D1Database, now = () => new Date()): FxSnapshotWriter {
  return {
    async upsertSnapshot(row) {
      const result = await db
        .prepare(
          `INSERT INTO fx_snapshots (base, quote, rate, as_of, source, created_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (base, quote, as_of, source) DO NOTHING`,
        )
        .bind(row.base, row.quote, row.rate, row.asOf, row.source, now().toISOString())
        .run();
      return { inserted: result.meta.changes > 0 };
    },
  };
}
