import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { expect } from 'vitest';

import { registerDeviceResponseSchema, wireErrorSchema, type WireError } from '@6pm/domain';

import { createApp } from '../src/app';
import type { RouteDefinition } from '../src/route';
import * as routes from '../src/routes/index.generated';

let nextAddress = 1;

/** A sender address no other test has used, so one test's requests never count against another's. */
export function freshIp(): string {
  nextAddress += 1;
  return `203.0.113.${nextAddress}`;
}

export type Call = {
  method?: string;
  token?: string;
  ip?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

/** Sends one request through the shipped routes plus any extra ones a test adds. */
export async function call(
  path: string,
  { method = 'GET', token, ip = freshIp(), body, headers: extraHeaders = {} }: Call = {},
  extraRoutes: readonly RouteDefinition[] = [],
): Promise<Response> {
  const headers = new Headers({ 'CF-Connecting-IP': ip, ...extraHeaders });
  if (token !== undefined) headers.set('Authorization', `Bearer ${token}`);
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  const app = createApp([...Object.values(routes), ...extraRoutes]);
  const ctx = createExecutionContext();
  const response = await app.fetch(
    new Request(`https://6pm-dev.oddeggs.studio${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    env,
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return response;
}

export async function registerDevice(token?: string): Promise<string> {
  const response = await call('/api/v1/devices', {
    method: 'POST',
    body: { language: 'en', ...(token === undefined ? {} : { token }) },
  });
  expect(response.status).toBe(200);
  return registerDeviceResponseSchema.parse(await response.json()).token;
}

export async function wireErrorOf(response: Response): Promise<WireError['error']> {
  return wireErrorSchema.parse(await response.json()).error;
}
