import type { Context } from 'hono';
import type { z } from 'zod';

import type { AppEnv } from './env';
import { ApiError } from './errors';

export type RouteContext = Context<AppEnv>;

/**
 * One route, one file in `src/routes/`. `device` routes need a registered device's bearer token
 * and count against that device's rate limit; `public` routes (health, registration) need neither.
 */
export type RouteDefinition = {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly path: `/v1/${string}`;
  readonly access: 'public' | 'device';
  readonly handle: (c: RouteContext) => Response | Promise<Response>;
};

/**
 * The JSON body, checked against a schema. A failure reports where and why, never the value sent:
 * a body can hold a user's spending.
 */
export async function readBody<S extends z.ZodType>(
  c: RouteContext,
  schema: S,
): Promise<z.infer<S>> {
  let json: unknown;
  try {
    json = await c.req.json();
  } catch {
    throw new ApiError('bad_request', 'The body is not valid JSON');
  }
  const parsed = schema.safeParse(json);
  if (parsed.success) return parsed.data;
  throw new ApiError('bad_request', 'The body does not match the route', {
    issues: parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      problem: issue.code,
    })),
  });
}
