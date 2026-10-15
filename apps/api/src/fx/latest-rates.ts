import { FX_STALE_HOURS, isFxStale, type FxRatesResponse } from '@6pm/domain';

import { FX_QUOTE } from './ingest';

interface Row {
  readonly id: number;
  readonly base: string;
  readonly rate: string;
  readonly as_of: string;
  readonly source: string;
}

/** Later than any rate's date: the newest rates, whatever day they are for. */
const NEWEST = '9999-12-31';

/**
 * The rates every phone reads: the newest stored rate of each currency against the đồng (the
 * source dates each currency on its own, so the newest day's rows are rarely a full set), pinned
 * on the newest row so a priced spend can say which run priced it. Rates stay exact strings.
 *
 * With `on` (a day, `YYYY-MM-DD`), each currency's rate is the newest one for that day or before
 * it, so a receipt is priced at the rate of the day it was paid; a currency with nothing that
 * early gets its newest rate. Staleness is then counted from the end of that day.
 */
export async function readLatestRates(
  db: D1Database,
  now = new Date(),
  on: string | null = null,
): Promise<FxRatesResponse> {
  const { results } = await db
    .prepare(
      `SELECT id, base, rate, as_of, source FROM (
         SELECT id, base, rate, as_of, source,
                ROW_NUMBER() OVER (
                  PARTITION BY base ORDER BY (as_of <= ?) DESC, as_of DESC, id DESC
                ) AS chosen
           FROM fx_snapshots WHERE quote = ?
       ) WHERE chosen = 1 ORDER BY base`,
    )
    .bind(on ?? NEWEST, FX_QUOTE)
    .all<Row>();
  const dayEnd = on === null ? now : new Date(`${on}T23:59:59Z`);
  const staleAt = dayEnd < now ? dayEnd : now;

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
    stale: pinned === null || isFxStale(pinned.as_of, staleAt, FX_STALE_HOURS),
    rates: results.map((row) => ({
      currency: row.base,
      rate: row.rate,
      asOf: row.as_of,
      source: row.source,
    })),
  };
}
