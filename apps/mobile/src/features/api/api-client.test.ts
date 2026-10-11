import { describe, expect, it, jest } from '@jest/globals';

import { z } from 'zod';

import { createApiClient } from './api-client';
import { ApiRequestError } from './api-error';
import type { DeviceTokenStore } from './device-token-store';

const TOKEN = 'a'.repeat(43);
const OTHER = 'b'.repeat(43);
const schema = z.object({ ok: z.literal(true) });

function reply(status: number, body: unknown): Response {
  return { status, json: () => Promise.resolve(body) } as unknown as Response;
}

function memoryTokens(initial: string | null): DeviceTokenStore & { value: string | null } {
  const store = {
    value: initial,
    read: () => Promise.resolve(store.value),
    write: (token: string) => {
      store.value = token;
      return Promise.resolve();
    },
  };
  return store;
}

type Call = { url: string; init: RequestInit };

/** A `fetch` from a function of the URL and init. */
function asFetch(
  fn: (url: string, init: RequestInit | undefined) => Promise<Response>,
): typeof fetch {
  return (input, init) =>
    fn(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, init);
}

function setup(
  handler: (call: Call) => Response | Promise<Response>,
  tokens: DeviceTokenStore = memoryTokens(null),
) {
  const calls: Call[] = [];
  const fetchMock = jest.fn((url: string, init: RequestInit | undefined) => {
    const call = { url, init: init ?? {} };
    calls.push(call);
    return Promise.resolve(handler(call));
  });
  const client = createApiClient({
    baseUrl: 'https://six.test/api',
    fetch: asFetch(fetchMock),
    tokens,
    language: () => 'vi',
    timeoutMs: 50,
  });
  return { client, calls };
}

const bearer = (call: Call) => (call.init.headers as Record<string, string>)['Authorization'];

describe('the server client', () => {
  it('registers the phone once, keeps the token and sends it as a bearer', async () => {
    const tokens = memoryTokens(null);
    const { client, calls } = setup(
      (call) =>
        call.url.endsWith('/v1/devices') ? reply(200, { token: TOKEN }) : reply(200, { ok: true }),
      tokens,
    );
    const request = { method: 'POST', path: '/v1/ask', body: { question: 'hi' }, schema } as const;
    await expect(client.request(request)).resolves.toEqual({ ok: true });
    await client.request(request);
    expect(calls.map((c) => c.url)).toEqual([
      'https://six.test/api/v1/devices',
      'https://six.test/api/v1/ask',
      'https://six.test/api/v1/ask',
    ]);
    expect(JSON.parse(calls[0]?.init.body as string)).toEqual({ language: 'vi' });
    expect(tokens.value).toBe(TOKEN);
    expect(bearer(calls[1] as Call)).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(calls[2]?.init.body as string)).toEqual({ question: 'hi' });
  });

  it('shares one registration between calls made together', async () => {
    const { client, calls } = setup((call) =>
      call.url.endsWith('/v1/devices') ? reply(200, { token: TOKEN }) : reply(200, { ok: true }),
    );
    await Promise.all([
      client.request({ path: '/v1/a', schema }),
      client.request({ path: '/v1/b', schema }),
    ]);
    expect(calls.filter((c) => c.url.endsWith('/v1/devices'))).toHaveLength(1);
  });

  it('tells the server about a token it has forgotten and tries once more', async () => {
    const tokens = memoryTokens(TOKEN);
    let known = false;
    const { client, calls } = setup((call) => {
      if (call.url.endsWith('/v1/devices')) {
        known = true;
        return reply(200, { token: TOKEN });
      }
      return known
        ? reply(200, { ok: true })
        : reply(401, { error: { code: 'unauthorized', message: 'no', retryable: false } });
    }, tokens);
    await expect(client.request({ path: '/v1/x', schema })).resolves.toEqual({ ok: true });
    expect(JSON.parse(calls[1]?.init.body as string)).toEqual({ language: 'vi', token: TOKEN });
  });

  it('gives up when the token is refused again', async () => {
    const { client } = setup((call) =>
      call.url.endsWith('/v1/devices')
        ? reply(200, { token: TOKEN })
        : reply(401, { error: { code: 'unauthorized', message: 'no', retryable: false } }),
    );
    await expect(client.request({ path: '/v1/x', schema })).rejects.toMatchObject({
      failure: 'unauthorized',
      retryable: false,
    });
  });

  it('turns the wire error into a failure that says whether to retry', async () => {
    const tokens = memoryTokens(OTHER);
    const { client } = setup(
      () => reply(503, { error: { code: 'model_unavailable', message: 'down', retryable: true } }),
      tokens,
    );
    await expect(client.request({ path: '/v1/x', schema })).rejects.toMatchObject({
      failure: 'unavailable',
      retryable: true,
    });
    const limited = setup(
      () => reply(429, { error: { code: 'rate_limited', message: 'slow', retryable: true } }),
      tokens,
    );
    await expect(limited.client.request({ path: '/v1/x', schema })).rejects.toMatchObject({
      failure: 'rate_limited',
    });
  });

  it('refuses an answer that is not what the route promises', async () => {
    const { client } = setup(() => reply(200, { ok: false }), memoryTokens(TOKEN));
    await expect(client.request({ path: '/v1/x', schema })).rejects.toMatchObject({
      failure: 'bad_response',
    });
  });

  it('times out a call that does not answer, and never puts the body in the error', async () => {
    const tokens = memoryTokens(TOKEN);
    const fetchMock = jest.fn(
      (_url: string, init: RequestInit | undefined) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const client = createApiClient({
      baseUrl: 'https://six.test/api',
      fetch: asFetch(fetchMock),
      tokens,
      language: () => 'en',
      timeoutMs: 20,
    });
    const error: unknown = await client
      .request({ method: 'POST', path: '/v1/ask', body: { question: 'secret 5tr' }, schema })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ failure: 'timeout', retryable: true });
    expect(String((error as Error).message)).not.toContain('secret');
    expect(String((error as Error).message)).not.toContain(TOKEN);
  });

  it('reports a dead connection as a network failure', async () => {
    const client = createApiClient({
      baseUrl: 'https://six.test/api',
      fetch: () => Promise.reject(new TypeError('Network request failed')),
      tokens: memoryTokens(TOKEN),
      language: () => 'en',
    });
    await expect(client.request({ path: '/v1/x', schema })).rejects.toMatchObject({
      failure: 'network',
    });
  });
});
