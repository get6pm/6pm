import { createMiddleware } from 'hono/factory';

import type { AppEnv } from './env';
import { ApiError } from './errors';

/** Both limits count over this window (`simple.period` in `wrangler.jsonc`). */
export const rateLimitWindowSeconds = 60;

function tooMany(): ApiError {
  return new ApiError('rate_limited', 'Too many requests. Try again in a minute.');
}

/** Every request counts against its sender's address. The address is a counter key, never stored. */
export const limitByIp = createMiddleware<AppEnv>(async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const { success } = await c.env.IP_RATE_LIMIT.limit({ key: ip });
  if (!success) throw tooMany();
  await next();
});

/** Runs after `requireDevice`: a device's requests count together, whatever network it is on. */
export const limitByDevice = createMiddleware<AppEnv>(async (c, next) => {
  const { success } = await c.env.DEVICE_RATE_LIMIT.limit({ key: c.var.device.hash });
  if (!success) throw tooMany();
  await next();
});
