import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import { hashDeviceToken } from '../src/device-auth';
import type { RouteDefinition } from '../src/route';

import { call, registerDevice, wireErrorOf } from './support';

const whoAmIRoute: RouteDefinition = {
  method: 'GET',
  path: '/v1/who-am-i',
  access: 'device',
  handle: (c) => c.json(c.var.device),
};

describe('device registration', () => {
  it('gives a new phone a token and stores only its hash', async () => {
    const token = await registerDevice();
    const rows = (await env.DB.prepare('SELECT * FROM devices').all()).results;
    expect(rows).toContainEqual(
      expect.objectContaining({ token_hash: await hashDeviceToken(token) }),
    );
    expect(JSON.stringify(rows)).not.toContain(token);
  });

  it('keeps a restored token, so one phone stays one device', async () => {
    const token = 'restored-from-the-keychain-0123456789abcdef';
    expect(await registerDevice(token)).toBe(token);
    expect(await registerDevice(token)).toBe(token);
    const hash = await hashDeviceToken(token);
    const { results } = await env.DB.prepare('SELECT * FROM devices WHERE token_hash = ?')
      .bind(hash)
      .all();
    expect(results).toHaveLength(1);
  });

  it('lets a registered device through and turns others away', async () => {
    const token = await registerDevice();
    const ok = await call('/api/v1/who-am-i', { token }, [whoAmIRoute]);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ hash: await hashDeviceToken(token), language: 'en' });

    const stranger = await call('/api/v1/who-am-i', { token: 'x'.repeat(40) }, [whoAmIRoute]);
    expect(stranger.status).toBe(401);
    expect(await wireErrorOf(stranger)).toMatchObject({ code: 'unauthorized', retryable: false });
  });
});

describe('the API surface', () => {
  it('answers health under /api with the build and the database state', async () => {
    const response = await call('/api/v1/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ commit: 'local', environment: 'dev', database: 'ok' });
  });

  it('answers unknown paths in the wire error shape', async () => {
    const response = await call('/api/v1/nope');
    expect(response.status).toBe(404);
    expect(await wireErrorOf(response)).toMatchObject({ code: 'not_found' });
  });
});
