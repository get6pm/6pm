import { Hono } from 'hono';
import { requestId } from 'hono/request-id';

import { requireBackupToken } from './backup-token';
import { requireDevice } from './device-auth';
import type { AppEnv } from './env';
import { ApiError, toApiError, wireError } from './errors';
import { limitByBackup, limitByDevice, limitByIp, rateLimitWindowSeconds } from './rate-limit';
import type { RouteDefinition } from './route';

/**
 * The API: a request id, the per-address limit, then each route behind the access it declares.
 * Every failure, an unknown path and an unexpected throw included, answers in the wire error shape.
 */
export function createApp(routes: readonly RouteDefinition[]): Hono<AppEnv> {
  // The Worker owns `<host>/api/*`; the website serves everything else on the same host.
  const app = new Hono<AppEnv>().basePath('/api');

  app.use(requestId());
  app.use(limitByIp);

  for (const route of routes) {
    if (route.access === 'device') {
      app.on(route.method, route.path, requireDevice, limitByDevice, route.handle);
    } else if (route.access === 'backup') {
      app.on(route.method, route.path, requireBackupToken, limitByBackup, route.handle);
    } else {
      app.on(route.method, route.path, route.handle);
    }
  }

  app.notFound((c) => {
    const { status, body } = wireError(new ApiError('not_found', 'No such route'));
    return c.json(body, status);
  });

  app.onError((error, c) => {
    const apiError = toApiError(error);
    if (apiError.code === 'internal') {
      // The path and the error only: never a body, a header or a query string.
      console.error('unhandled error', { requestId: c.var.requestId, path: c.req.path, error });
    }
    if (apiError.code === 'rate_limited') c.header('Retry-After', String(rateLimitWindowSeconds));
    const { status, body } = wireError(apiError);
    return c.json(body, status);
  });

  return app;
}
