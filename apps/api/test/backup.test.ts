import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import {
  BACKUP_MAX_BODY_BYTES,
  BACKUP_MAX_SEALED_BYTES,
  BACKUP_TOKEN_HEADER,
  getBackupResponseSchema,
  putBackupResponseSchema,
} from '@6pm/domain';

import { backupObjectKey } from '../src/backup-token';
import { hashDeviceToken, newDeviceToken } from '../src/device-auth';

import { call, freshIp, wireErrorOf } from './support';

/** A well-formed envelope whose sealed data is `length` bytes. */
function envelope(length = 64, version = 1) {
  const chunk = 3 * 1024;
  const whole = Math.floor(length / chunk);
  const rest = length - whole * chunk;
  const piece = (n: number) => btoa(String.fromCharCode(...new Uint8Array(n).fill(7)));
  // Base64 of each 3-byte-aligned chunk joins cleanly; the remainder carries the padding.
  const data = piece(chunk).repeat(whole) + (rest > 0 ? piece(rest) : '');
  return { version, data };
}

const withToken = (token: string) => ({ [BACKUP_TOKEN_HEADER]: token });
const put = (token: string, body: unknown, ip = freshIp()) =>
  call('/api/v1/backup', { method: 'PUT', headers: withToken(token), body, ip });
const get = (token: string) => call('/api/v1/backup', { headers: withToken(token) });
const remove = (token: string) =>
  call('/api/v1/backup', { method: 'DELETE', headers: withToken(token) });

describe('storing a backup', () => {
  it('keeps the sealed snapshot and gives it back exactly as it was sent', async () => {
    const token = newDeviceToken();
    const sent = envelope(500);
    const stored = await put(token, sent);
    expect(stored.status).toBe(200);
    const kept = putBackupResponseSchema.parse(await stored.json());
    expect(kept.bytes).toBe(500);

    const fetched = await get(token);
    expect(fetched.status).toBe(200);
    expect(fetched.headers.get('Cache-Control')).toBe('no-store');
    const answer = getBackupResponseSchema.parse(await fetched.json());
    expect(answer.envelope).toEqual(sent);
    expect(answer.updatedAt).toBe(kept.updatedAt);
  });

  it('replaces the earlier backup under the same token', async () => {
    const token = newDeviceToken();
    await put(token, envelope(100));
    const second = envelope(300);
    expect((await put(token, second)).status).toBe(200);
    const answer = getBackupResponseSchema.parse(await (await get(token)).json());
    expect(answer.envelope).toEqual(second);
  });

  it('files it under the token hash and never keeps the token', async () => {
    const token = newDeviceToken();
    await put(token, envelope(64));
    const hash = await hashDeviceToken(token);
    const { objects } = await env.FILES.list({ prefix: 'backups/' });
    const keys = objects.map((object) => object.key);
    expect(keys).toContain(backupObjectKey(hash));
    expect(keys.join()).not.toContain(token);
    const stored = await env.FILES.get(backupObjectKey(hash));
    expect(await stored?.text()).not.toContain(token);
  });

  it('keeps one token out of the reach of another', async () => {
    const mine = newDeviceToken();
    await put(mine, envelope(64));
    const other = await get(newDeviceToken());
    expect(other.status).toBe(404);
    expect(await wireErrorOf(other)).toMatchObject({ code: 'not_found', retryable: false });
  });

  it('turns away a missing or malformed backup token', async () => {
    for (const headers of [{}, withToken('short'), withToken('has spaces '.repeat(5))]) {
      const response = await call('/api/v1/backup', { headers });
      expect(response.status).toBe(401);
      expect(await wireErrorOf(response)).toMatchObject({ code: 'unauthorized' });
    }
  });
});

describe('what the server accepts', () => {
  it.each([
    ['text that is not JSON', 'not json'],
    ['an unknown version', { version: 0, data: envelope(64).data }],
    ['extra fields', { ...envelope(64), key: 'x' }],
    ['data that is not base64', { version: 1, data: '!!!!'.repeat(20) }],
    ['data too short to hold a nonce and a tag', envelope(20)],
  ])('refuses %s and keeps the earlier backup', async (_name, body) => {
    const token = newDeviceToken();
    const earlier = envelope(64);
    await put(token, earlier);
    const response = await call('/api/v1/backup', {
      method: 'PUT',
      headers: withToken(token),
      body,
    });
    expect(response.status).toBe(400);
    expect(await wireErrorOf(response)).toMatchObject({ code: 'bad_request' });
    const answer = getBackupResponseSchema.parse(await (await get(token)).json());
    expect(answer.envelope).toEqual(earlier);
  });

  const BIG = 60_000;

  it(
    'refuses sealed data over the cap and keeps the earlier backup',
    { timeout: BIG },
    async () => {
      const token = newDeviceToken();
      const earlier = envelope(64);
      await put(token, earlier);
      const response = await put(token, envelope(BACKUP_MAX_SEALED_BYTES + 3));
      expect(response.status).toBe(400);
      const issues = (await wireErrorOf(response)).detail?.['issues'];
      expect(JSON.stringify(issues)).toContain('"path":"data"');
      expect(getBackupResponseSchema.parse(await (await get(token)).json()).envelope).toEqual(
        earlier,
      );
    },
  );

  it('refuses a body far over the cap before reading it', { timeout: BIG }, async () => {
    const token = newDeviceToken();
    const earlier = envelope(64);
    await put(token, earlier);
    const response = await put(token, envelope(BACKUP_MAX_SEALED_BYTES * 2));
    expect(response.status).toBe(400);
    expect((await wireErrorOf(response)).detail).toMatchObject({
      reason: 'too_large',
      maxBytes: BACKUP_MAX_BODY_BYTES,
    });
    expect(getBackupResponseSchema.parse(await (await get(token)).json()).envelope).toEqual(
      earlier,
    );
  });

  it('takes a backup at the size cap', { timeout: BIG }, async () => {
    const token = newDeviceToken();
    const response = await put(token, envelope(BACKUP_MAX_SEALED_BYTES));
    expect(response.status).toBe(200);
    expect(putBackupResponseSchema.parse(await response.json()).bytes).toBe(
      BACKUP_MAX_SEALED_BYTES,
    );
  });
});

describe('asking about a backup', () => {
  it('says when it was kept and how big, without sending it', async () => {
    const token = newDeviceToken();
    const kept = putBackupResponseSchema.parse(await (await put(token, envelope(1234))).json());
    const response = await call('/api/v1/backup/meta', { headers: withToken(token) });
    expect(response.status).toBe(200);
    expect(putBackupResponseSchema.parse(await response.json())).toEqual(kept);
  });

  it('answers not found when there is none', async () => {
    const response = await call('/api/v1/backup/meta', { headers: withToken(newDeviceToken()) });
    expect(response.status).toBe(404);
    expect(await wireErrorOf(response)).toMatchObject({ code: 'not_found' });
  });
});

describe('deleting a backup', () => {
  it('removes it, and answers the same when there was none', async () => {
    const token = newDeviceToken();
    await put(token, envelope(64));
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await remove(token);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ deleted: true });
    }
    expect((await get(token)).status).toBe(404);
    expect(await env.FILES.head(backupObjectKey(await hashDeviceToken(token)))).toBeNull();
  });
});

describe('rate limiting', () => {
  it('stops one token after its allowance and says when to retry', async () => {
    const token = newDeviceToken();
    const statuses: number[] = [];
    let last: Response | undefined;
    for (let attempt = 0; attempt < 14; attempt += 1) {
      last = await get(token);
      statuses.push(last.status);
    }
    expect(statuses.slice(0, 12).every((status) => status === 404)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
    expect(last?.headers.get('Retry-After')).toBe('60');
    expect(await wireErrorOf(last as Response)).toMatchObject({
      code: 'rate_limited',
      retryable: true,
    });
  });

  it('counts one address across tokens', async () => {
    const ip = freshIp();
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 14; attempt += 1) {
      const response = await call('/api/v1/backup', {
        headers: withToken(newDeviceToken()),
        ip,
      });
      statuses.push(response.status);
    }
    expect(statuses.at(-1)).toBe(429);
  });
});
