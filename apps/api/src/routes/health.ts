import { ApiError } from '../errors';
import type { RouteDefinition } from '../route';

/** Which commit is running where, and whether the database answers. */
export const healthRoute: RouteDefinition = {
  method: 'GET',
  path: '/v1/health',
  access: 'public',
  handle: async (c) => {
    const build = { commit: c.env.COMMIT_SHA, environment: c.env.ENVIRONMENT };
    try {
      await c.env.DB.prepare('SELECT 1').first();
    } catch {
      throw new ApiError('internal', 'The database is not answering', {
        ...build,
        database: 'down',
      });
    }
    return c.json({ ...build, database: 'ok' });
  },
};
