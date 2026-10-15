import { ApiError } from '../errors';
import { readLatestRates } from '../fx/latest-rates';
import type { RouteDefinition } from '../route';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The newest exchange rate of each currency in đồng, with the date they are for and
 * whether they are stale. Before the first ingest the list is empty and `stale` is true; a phone
 * keeps the last good set it has. `?on=YYYY-MM-DD` asks for the rates of that day (the newest on
 * or before it, else the newest), to price a receipt at the rate of the day it was paid.
 */
export const fxRoute: RouteDefinition = {
  method: 'GET',
  path: '/v1/fx',
  access: 'device',
  handle: async (c) => {
    const on = c.req.query('on') ?? null;
    if (on !== null && (!DAY.test(on) || Number.isNaN(Date.parse(`${on}T00:00:00Z`)))) {
      throw new ApiError('bad_request', 'on must be a day, YYYY-MM-DD');
    }
    const body = await readLatestRates(c.env.DB, new Date(), on);
    // The same for every device and new at most a few times a day.
    c.header('Cache-Control', 'private, max-age=3600');
    return c.json(body);
  },
};
