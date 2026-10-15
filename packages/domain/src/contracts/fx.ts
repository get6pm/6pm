import { z } from 'zod';

import { DECIMAL_PATTERN } from '../travel/fx';

/**
 * `GET /v1/fx`: the newest rate of each currency against the đồng, as the server's daily
 * ingest stored it. A rate is đồng for one unit of the currency, as an exact decimal string; a
 * rate in any other home currency is two of them divided (`homeFxRate`). A currency the source
 * has no rate for is absent.
 */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const fxRateSchema = z.object({
  /** ISO 4217: "THB". */
  currency: z.string().regex(/^[A-Z]{3}$/),
  /** Đồng for one unit: "770.17". */
  rate: z.string().regex(DECIMAL_PATTERN),
  /** The date the source says the rate is for. */
  asOf: isoDate,
  source: z.string().min(1),
});
export type FxRate = z.infer<typeof fxRateSchema>;

export const fxRatesResponseSchema = z.object({
  /** The stored row the set is pinned on, so a priced spend can say which run priced it. */
  snapshotId: z.string().nullable(),
  /** The newest `asOf` in the set; null before the first ingest. */
  asOf: isoDate.nullable(),
  /** The newest rate is older than the staleness threshold, or there is none. */
  stale: z.boolean(),
  rates: z.array(fxRateSchema),
});
export type FxRatesResponse = z.infer<typeof fxRatesResponseSchema>;
