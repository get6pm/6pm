import { FX_STALE_HOURS, isFxStale, isRate, TRAVEL_CURRENCY_CODES } from '@6pm/domain';

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
  /** Default: every travel currency. */
  readonly currencies?: readonly string[];
}

/**
 * Fetches each travel currency's rate in đồng and stores it once. Frankfurter is asked one base
 * at a time (`base=THB&quotes=VND`), because asking for the đồng as the base would come back
 * with two or three significant digits. A currency that fails, or comes back without a usable
 * đồng rate, is reported in `rejected` and never stops the others.
 */
export async function ingestFxSnapshots(
  writer: FxSnapshotWriter,
  options: IngestOptions = {},
): Promise<IngestResult> {
  const currencies = options.currencies ?? TRAVEL_CURRENCY_CODES;
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

  const now = options.now ?? new Date();
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
