import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import { waitlistResponseSchema } from '@6pm/domain';

import { call, wireErrorOf } from './support';

let nextInbox = 0;

/** An address no other test has used. */
function freshEmail(): string {
  nextInbox += 1;
  return `listener${nextInbox}@example.com`;
}

function join(body: unknown): Promise<Response> {
  return call('/api/v1/waitlist', { method: 'POST', body });
}

async function ticketFor(body: unknown): Promise<number> {
  const response = await join(body);
  expect(response.status).toBe(200);
  return waitlistResponseSchema.parse(await response.json()).ticket;
}

async function rowsFor(email: string): Promise<Record<string, unknown>[]> {
  const { results } = await env.DB.prepare('SELECT * FROM waitlist WHERE email = ?')
    .bind(email)
    .all();
  return results;
}

describe('joining the waitlist', () => {
  it('stores a new email trimmed and lowercased and answers with only its ticket', async () => {
    const email = freshEmail();
    const response = await join({
      email: `  ${email.toUpperCase()} `,
      language: 'vi',
      leak: 5_318_000,
    });
    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    expect(Object.keys(body as object)).toEqual(['ticket']);
    const { ticket } = waitlistResponseSchema.parse(body);

    expect(await rowsFor(email)).toEqual([
      expect.objectContaining({ ticket, email, language: 'vi', leak: 5_318_000 }),
    ]);
  });

  it('hands out tickets in order', async () => {
    const first = await ticketFor({ email: freshEmail(), language: 'en' });
    const second = await ticketFor({ email: freshEmail(), language: 'en' });
    expect(second).toBe(first + 1);
  });

  it('keeps the leak empty when the visitor did not work one out', async () => {
    const email = freshEmail();
    await ticketFor({ email, language: 'en' });
    expect(await rowsFor(email)).toEqual([expect.objectContaining({ leak: null })]);
  });
});

describe('joining twice', () => {
  it('gives the same ticket for the same inbox, however it is typed, and stores it once', async () => {
    const email = freshEmail();
    const ticket = await ticketFor({ email, language: 'en' });
    expect(await ticketFor({ email: ` ${email.toUpperCase()}`, language: 'vi', leak: 1 })).toBe(
      ticket,
    );
    expect(await rowsFor(email)).toEqual([
      expect.objectContaining({ ticket, language: 'en', leak: null }),
    ]);
  });

  it('does not skip a ticket for the repeat', async () => {
    const email = freshEmail();
    const ticket = await ticketFor({ email, language: 'en' });
    await ticketFor({ email, language: 'en' });
    expect(await ticketFor({ email: freshEmail(), language: 'en' })).toBe(ticket + 1);
  });
});

describe('a request the list turns down', () => {
  it.each([
    ['no at sign', 'listener.example.com'],
    ['no domain', 'listener@'],
    ['spaces inside', 'list ener@example.com'],
    ['empty', '   '],
  ])('rejects an email with %s', async (_, email) => {
    const response = await join({ email, language: 'en' });
    expect(response.status).toBe(400);
    expect(await wireErrorOf(response)).toMatchObject({ code: 'bad_request', retryable: false });
  });

  it.each([
    ['no language', { email: 'a@example.com' }],
    ['an unknown language', { email: 'a@example.com', language: 'fr' }],
    ['a negative leak', { email: 'a@example.com', language: 'en', leak: -1 }],
    ['a fractional leak', { email: 'a@example.com', language: 'en', leak: 12.5 }],
    ['a leak as text', { email: 'a@example.com', language: 'en', leak: '5tr' }],
    ['no email', { language: 'en' }],
    ['a list instead of an object', ['a@example.com']],
  ])('rejects a body with %s and stores nothing', async (_, body) => {
    const response = await join(body);
    expect(response.status).toBe(400);
    const error = await wireErrorOf(response);
    expect(error).toMatchObject({ code: 'bad_request' });
    // The reason names the field, never the value that was sent.
    expect(JSON.stringify(error)).not.toContain('a@example.com');
    expect(await rowsFor('a@example.com')).toEqual([]);
  });

  it('rejects a body that is not JSON', async () => {
    const response = await call('/api/v1/waitlist', { method: 'POST', body: undefined });
    expect(response.status).toBe(400);
    expect(await wireErrorOf(response)).toMatchObject({ code: 'bad_request' });
  });

  it('only accepts POST', async () => {
    const response = await call('/api/v1/waitlist');
    expect(response.status).toBe(404);
  });
});
