import { env } from 'cloudflare:workers';
import { expect } from 'vitest';

import { createInviteResponseSchema, togetherStateSchema, type TogetherState } from '@6pm/domain';

import { appleJwt } from './apple-stand-in';
import { call, registerDevice, type Call } from './support';

let nextPerson = 0;

export interface Person {
  readonly token: string;
  readonly sub: string;
}

/** A registered phone signed in with Apple as a new person. */
export async function signedIn(name?: string): Promise<Person> {
  nextPerson += 1;
  const sub = `000${nextPerson}.${crypto.randomUUID()}`;
  const token = await registerDevice();
  const response = await call('/api/v1/together/sign-in', {
    method: 'POST',
    token,
    body: { identityToken: await appleJwt({ sub }), ...(name === undefined ? {} : { name }) },
  });
  expect(response.status).toBe(200);
  return { token, sub };
}

export async function stateOf(person: Person): Promise<TogetherState> {
  const response = await call('/api/v1/together', { token: person.token });
  expect(response.status).toBe(200);
  return togetherStateSchema.parse(await response.json());
}

/** Sends a Budget together request as `person`. */
export function as(person: Person, path: string, init: Omit<Call, 'token'> = {}) {
  return call(`/api/v1/together${path}`, { ...init, token: person.token });
}

export const potBody = (over: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  name: 'Đà Lạt trip',
  icon: 'flight',
  hue: 85,
  goal: 3_000_000,
  neededBy: '2026-12',
  ...over,
});

export async function newPot(person: Person, over: Record<string, unknown> = {}) {
  const body = potBody(over);
  const response = await as(person, '/pots', { method: 'POST', body });
  expect(response.status).toBe(200);
  return body.id;
}

export async function invite(person: Person): Promise<string> {
  const response = await as(person, '/invites', { method: 'POST' });
  expect(response.status).toBe(200);
  return createInviteResponseSchema.parse(await response.json()).code;
}

/** Two people in one pair: `a` started it, `b` took the invite. */
export async function pairUp(): Promise<{ a: Person; b: Person }> {
  const a = await signedIn('An');
  const b = await signedIn('Bình');
  const code = await invite(a);
  const response = await as(b, `/invites/${code}/accept`, { method: 'POST' });
  expect(response.status).toBe(200);
  return { a, b };
}

export async function contribute(person: Person, potId: string, amount: number) {
  const id = crypto.randomUUID();
  const response = await as(person, `/pots/${potId}/contributions`, {
    method: 'POST',
    body: { id, amount },
  });
  return { id, response };
}

/** How many rows a table holds for a pair. */
export async function rowsOf(table: string, pairId: string): Promise<number> {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE pair_id = ?`)
    .bind(pairId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}
