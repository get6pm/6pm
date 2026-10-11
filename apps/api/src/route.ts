import type { Context } from 'hono';
import type { z } from 'zod';

import type { AppEnv } from './env';
import { ApiError } from './errors';

export type RouteContext = Context<AppEnv>;

/**
 * One route, one file in `src/routes/`. `device` routes need a registered device's bearer token
 * and count against that device's rate limit; `backup` routes need a backup token header and
 * count against that token's and the sender's backup limit; `public` routes (health,
 * registration) need neither.
 */
export type RouteDefinition = {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly path: `/v1/${string}`;
  readonly access: 'public' | 'device' | 'backup';
  readonly handle: (c: RouteContext) => Response | Promise<Response>;
};

/**
 * The JSON body, checked against a schema. A failure reports where and why, never the value sent:
 * a body can hold a user's spending.
 */
export async function readBody<S extends z.ZodType>(
  c: RouteContext,
  schema: S,
  options: { readonly maxBytes?: number } = {},
): Promise<z.infer<S>> {
  const { maxBytes } = options;
  const tooLarge = () =>
    new ApiError('bad_request', 'The body is too large', { reason: 'too_large', maxBytes });
  // The declared length is checked before the body is read, the real one after.
  const declared = Number(c.req.header('Content-Length'));
  if (maxBytes !== undefined && Number.isFinite(declared) && declared > maxBytes) throw tooLarge();
  let json: unknown;
  try {
    const bytes = await c.req.arrayBuffer();
    if (maxBytes !== undefined && bytes.byteLength > maxBytes) throw tooLarge();
    json = JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    if (error instanceof ApiError) throw error;
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
