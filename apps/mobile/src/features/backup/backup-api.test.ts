import { describe, expect, it, jest } from '@jest/globals';

import { BACKUP_TOKEN_HEADER } from '@6pm/domain';

import { createBackupApi } from './backup-api';
import { BackupError } from './backup-error';

const TOKEN = 'T'.repeat(43);
const ENVELOPE = { version: 1, data: Buffer.alloc(64, 7).toString('base64') };
const WHEN = '2026-10-11T12:00:00.000Z';

function api(respond: (init: RequestInit) => Response | Promise<Response>) {
  const calls: { url: string; init: RequestInit }[] = [];
  // The client only ever calls fetch with a URL string and an init object.
  const fetch = jest.fn((url: string, init: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve(respond(init));
  });
  return {
    calls,
    client: createBackupApi({
      baseUrl: 'https://6pm-dev.oddeggs.studio/api',
      fetch: fetch as unknown as typeof globalThis.fetch,
      timeoutMs: 200,
    }),
  };
}

function bodyOf(init: RequestInit | undefined): unknown {
  return typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
}

const json = (body: unknown, status = 200) => Response.json(body, { status });
const wireError = (code: string, status: number, detail?: object) =>
  json({ error: { code, message: 'm', retryable: false, ...(detail ? { detail } : {}) } }, status);

describe('the backup API', () => {
  it('puts the envelope with the token in a header and nowhere else', async () => {
    const { client, calls } = api(() => json({ updatedAt: WHEN, bytes: 64 }));
    expect(await client.put(TOKEN, ENVELOPE)).toEqual({ updatedAt: WHEN, bytes: 64 });
    const [call] = calls;
    expect(call?.url).toBe('https://6pm-dev.oddeggs.studio/api/v1/backup');
    expect(call?.init.method).toBe('PUT');
    expect(call?.init.headers).toMatchObject({ [BACKUP_TOKEN_HEADER]: TOKEN });
    expect(call?.url).not.toContain(TOKEN);
    expect(bodyOf(call?.init)).toEqual(ENVELOPE);
  });

  it('gets the envelope, or null when there is none', async () => {
    const found = api(() => json({ envelope: ENVELOPE, updatedAt: WHEN }));
    expect(await found.client.get(TOKEN)).toEqual({ envelope: ENVELOPE, updatedAt: WHEN });
    const none = api(() => wireError('not_found', 404));
    expect(await none.client.get(TOKEN)).toBeNull();
    expect(await none.client.meta(TOKEN)).toBeNull();
  });

  it('asks about a backup without downloading it', async () => {
    const { client, calls } = api(() => json({ updatedAt: WHEN, bytes: 64 }));
    expect(await client.meta(TOKEN)).toEqual({ updatedAt: WHEN, bytes: 64 });
    expect(calls[0]?.url).toMatch(/\/v1\/backup\/meta$/);
  });

  it('deletes', async () => {
    const { client, calls } = api(() => json({ deleted: true }));
    await client.remove(TOKEN);
    expect(calls[0]?.init.method).toBe('DELETE');
  });

  it('maps the size refusal to too_large and every other failure to network', async () => {
    const big = api(() => wireError('bad_request', 400, { reason: 'too_large' }));
    await expect(big.client.put(TOKEN, ENVELOPE)).rejects.toMatchObject({ reason: 'too_large' });
    for (const response of [
      wireError('rate_limited', 429),
      wireError('internal', 500),
      wireError('unauthorized', 401),
      json({ unexpected: true }, 200),
    ]) {
      const { client } = api(() => response.clone());
      await expect(client.get(TOKEN)).rejects.toBeInstanceOf(BackupError);
      await expect(client.get(TOKEN)).rejects.toMatchObject({ reason: 'network' });
    }
  });

  it('reports a network failure and a timeout without the token', async () => {
    const offline = api(() => Promise.reject(new TypeError('Network request failed')));
    const failure: unknown = await offline.client.get(TOKEN).catch((error: unknown) => error);
    expect(failure).toMatchObject({ reason: 'network' });
    expect(String((failure as Error).message)).not.toContain(TOKEN);

    const slow = api(
      (init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    await expect(slow.client.get(TOKEN)).rejects.toMatchObject({ reason: 'network' });
  });
});
