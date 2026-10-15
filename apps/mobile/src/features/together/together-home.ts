import {
  currencyOf,
  fxRatesResponseSchema,
  sharedInHome,
  type Currency,
  type FxRate,
} from '@6pm/domain';

import type { SqlDatabase } from '../../data/table';
import type { InHome } from '../../data/together-moves';
import type { ApiClient } from '../api/api-client';
import { FX_CACHE_KEY, parseFxCache, rateFor } from '../travel/trip';

/**
 * How this phone counts a contribution to a pot kept in another currency against its own plan:
 * through the server's đồng quotes, the kept set first, and a fresh set asked for at most once,
 * only when the kept one lacks a quote it needs. Offline with no quote the contribution waits
 * (null) rather than count on a guess. A pot in the home currency needs no rate at all.
 */
export function inHomeFor(db: SqlDatabase, api: ApiClient, home: Currency): InHome {
  let kept: Promise<(code: string) => string | null> | null = null;
  let fresh: Promise<readonly FxRate[]> | null = null;
  const keptQuotes = () =>
    (kept ??= db
      .getAllAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [FX_CACHE_KEY])
      .then(([row]) => {
        const cache = parseFxCache(row?.value);
        return (code: string) => rateFor(cache, code)?.rate ?? null;
      }));
  const freshRates = () =>
    (fresh ??= api
      .request({ path: '/v1/fx', schema: fxRatesResponseSchema })
      .then((answer) => answer.rates)
      // Offline or the server is down: what is kept stands.
      .catch(() => []));
  return async (amount, code) => {
    const pot = currencyOf(code);
    if (pot.code === home.code) return amount;
    const quote = await keptQuotes();
    const counted = sharedInHome(amount, pot, home, quote);
    if (counted !== null) return counted;
    const rates = await freshRates();
    const either = (c: string) => rates.find((r) => r.currency === c)?.rate ?? quote(c);
    return sharedInHome(amount, pot, home, either);
  };
}
