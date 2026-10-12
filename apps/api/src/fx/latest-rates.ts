import { FX_STALE_HOURS, isFxStale, type FxRatesResponse } from '@6pm/domain';

import { FX_QUOTE } from './ingest';

interface Row {
  readonly id: number;
  readonly base: string;
  readonly rate: string;
  readonly as_of: string;
  readonly source: string;
}

/**
 * The rates every phone reads: the newest stored rate of each currency against the đồng (the
 * source dates each currency on its own, so the newest day's rows are rarely a full set), pinned
 * on the newest row so a priced spend can say which run priced it. Rates stay exact strings.
 */
export async function readLatestRates(db: D1Database, now = new Date()): Promise<FxRatesResponse> {
  const { results } = await db
    .prepare(
      `SELECT id, base, rate, as_of, source FROM (
         SELECT id, base, rate, as_of, source,
                ROW_NUMBER() OVER (PARTITION BY base ORDER BY as_of DESC, id DESC) AS newest
           FROM fx_snapshots WHERE quote = ?
       ) WHERE newest = 1 ORDER BY base`,
    )
    .bind(FX_QUOTE)
    .all<Row>();

  let pinned: Row | null = null;
  for (const row of results) {
    if (
      pinned === null ||
      row.as_of > pinned.as_of ||
      (row.as_of === pinned.as_of && row.id > pinned.id)
    ) {
      pinned = row;
    }
  }
  return {
    snapshotId: pinned === null ? null : String(pinned.id),
    asOf: pinned?.as_of ?? null,
    stale: pinned === null || isFxStale(pinned.as_of, now, FX_STALE_HOURS),
    rates: results.map((row) => ({
      currency: row.base,
      rate: row.rate,
      asOf: row.as_of,
      source: row.source,
    })),
  };
}
