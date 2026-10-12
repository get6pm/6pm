import { readLatestRates } from '../fx/latest-rates';
import type { RouteDefinition } from '../route';

/**
 * The newest exchange rate of each travel currency in đồng, with the date they are for and
 * whether they are stale. Before the first ingest the list is empty and `stale` is true; a phone
 * keeps the last good set it has.
 */
export const fxRoute: RouteDefinition = {
  method: 'GET',
  path: '/v1/fx',
  access: 'device',
  handle: async (c) => {
    const body = await readLatestRates(c.env.DB);
    // The same for every device and new at most a few times a day.
    c.header('Cache-Control', 'private, max-age=3600');
    return c.json(body);
  },
};
