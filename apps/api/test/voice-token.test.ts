import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { dayStartAtOffset, UTC_OFFSET_HEADER, voiceTokenResponseSchema } from '@6pm/domain';

import { createApp } from '../src/app';
import { hashDeviceToken } from '../src/device-auth';
import type { Bindings } from '../src/env';
import * as routes from '../src/routes/index.generated';

import { sentBody } from './anthropic-stand-in';
import { call, freshIp, registerDevice, wireErrorOf } from './support';

/** Deepgram chosen, whatever the test environment picks. */
const DEEPGRAM: Partial<Bindings> = { VOICE_PROVIDER: 'deepgram', DEEPGRAM_API_KEY: 'dg-key' };

/** Asks for a voice token with the given bindings on top of the test environment's. */
async function mint(
  token: string,
  bindings: Partial<Bindings>,
  body: unknown = { language: 'vi' },
  headers: Record<string, string> = {},
): Promise<Response> {
  const app = createApp(Object.values(routes));
  const ctx = createExecutionContext();
  const response = await app.fetch(
    new Request('https://6pm-dev.oddeggs.studio/api/v1/voice/token', {
      method: 'POST',
      headers: {
        'CF-Connecting-IP': freshIp(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    }),
    { ...env, ...bindings },
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return response;
}

async function ledgerRows(token: string) {
  const { results } = await env.DB.prepare(
    "SELECT model, input_tokens, output_tokens FROM ai_usage WHERE route = 'voice.token' AND device_hash = ?",
  )
    .bind(await hashDeviceToken(token))
    .all();
  return results;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /v1/voice/token', () => {
  it('needs a registered device', async () => {
    const response = await call('/api/v1/voice/token', {
      method: 'POST',
      body: { language: 'vi' },
    });
    expect(response.status).toBe(401);
  });

  it('turns away a language it does not transcribe', async () => {
    const token = await registerDevice();
    const response = await mint(token, DEEPGRAM, { language: 'fr' });
    expect(response.status).toBe(400);
  });

  it('says the transcriber is unavailable, retryably, when no key is set', async () => {
    const token = await registerDevice();
    const vendor = vi.spyOn(globalThis, 'fetch');
    const response = await mint(token, {});
    expect(response.status).toBe(503);
    expect(await wireErrorOf(response)).toMatchObject({
      code: 'model_unavailable',
      retryable: true,
    });
    expect(vendor).not.toHaveBeenCalled();
    expect(await ledgerRows(token)).toEqual([]);
  });

  it('grants a thirty-second Deepgram token with retention opted out, and writes the ledger', async () => {
    const token = await registerDevice();
    const vendor = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ access_token: 'jwt-test', expires_in: 30 }));
    const response = await mint(token, DEEPGRAM);
    expect(response.status).toBe(200);
    const answer = voiceTokenResponseSchema.parse(await response.json());
    expect(answer).toMatchObject({
      provider: 'deepgram',
      token: 'jwt-test',
      url: 'wss://api.deepgram.com/v1/listen',
      params: {
        model: 'nova-3',
        language: 'vi',
        encoding: 'linear16',
        sample_rate: '16000',
        interim_results: 'true',
        mip_opt_out: 'true',
      },
    });
    const left = Date.parse(answer.expiresAt) - Date.now();
    expect(left).toBeGreaterThan(20_000);
    expect(left).toBeLessThanOrEqual(30_000);

    const [url, init] = vendor.mock.calls[0] ?? [];
    expect(url).toBe('https://api.deepgram.com/v1/auth/grant');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Token dg-key');
    expect(sentBody(init)).toEqual({ ttl_seconds: 30 });
    expect(await ledgerRows(token)).toEqual([
      { model: 'nova-3', input_tokens: 0, output_tokens: 0 },
    ]);
  });

  it('mints a single-use ElevenLabs token that leaves the language to the transcriber', async () => {
    const token = await registerDevice();
    const vendor = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ token: 'sutkn_test' }));
    const response = await mint(token, {
      VOICE_PROVIDER: 'elevenlabs',
      ELEVENLABS_API_KEY: 'el-key',
      DEEPGRAM_API_KEY: 'dg-key',
    });
    expect(response.status).toBe(200);
    const answer = voiceTokenResponseSchema.parse(await response.json());
    expect(answer).toMatchObject({
      provider: 'elevenlabs',
      token: 'sutkn_test',
      url: 'wss://api.elevenlabs.io/v1/speech-to-text/realtime',
      params: {
        model_id: 'scribe_v2_realtime',
        audio_format: 'pcm_16000',
        commit_strategy: 'vad',
      },
    });
    // Named, it would hear only the app's language; unnamed, it hears whichever the user speaks.
    expect(answer.params['language_code']).toBeUndefined();
    // Logging stays on until the account has zero retention.
    expect(answer.params['enable_logging']).toBeUndefined();
    const [url, init] = vendor.mock.calls[0] ?? [];
    expect(url).toBe('https://api.elevenlabs.io/v1/single-use-token/realtime_scribe');
    expect(new Headers(init?.headers).get('xi-api-key')).toBe('el-key');
    expect(await ledgerRows(token)).toEqual([
      { model: 'scribe_v2_realtime', input_tokens: 0, output_tokens: 0 },
    ]);
  });

  it('turns ElevenLabs logging off on a zero-retention account', async () => {
    const token = await registerDevice();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ token: 'sutkn_test' }));
    const response = await mint(token, {
      VOICE_PROVIDER: 'elevenlabs',
      ELEVENLABS_API_KEY: 'el-key',
      ELEVENLABS_ZERO_RETENTION: 'true',
    });
    const answer = voiceTokenResponseSchema.parse(await response.json());
    expect(answer.params['enable_logging']).toBe('false');
  });

  it('reports a vendor refusal as unavailable without its body, and writes no ledger row', async () => {
    const token = await registerDevice();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ err_msg: 'Invalid credentials' }, { status: 401 }),
    );
    const response = await mint(token, DEEPGRAM);
    expect(response.status).toBe(503);
    const error = await wireErrorOf(response);
    expect(error).toMatchObject({ code: 'model_unavailable', detail: { reason: 'status_401' } });
    expect(JSON.stringify(error)).not.toContain('Invalid credentials');
    expect(await ledgerRows(token)).toEqual([]);
  });

  it('stops a device at two hundred tokens a day', async () => {
    const token = await registerDevice();
    const hash = await hashDeviceToken(token);
    const now = new Date().toISOString();
    await env.DB.batch(
      Array.from({ length: 200 }, () =>
        env.DB.prepare(
          `INSERT INTO ai_usage (route, model, input_tokens, output_tokens, device_hash, created_at)
           VALUES ('voice.token', 'nova-3', 0, 0, ?, ?)`,
        ).bind(hash, now),
      ),
    );
    const vendor = vi.spyOn(globalThis, 'fetch');
    const response = await mint(token, DEEPGRAM);
    expect(response.status).toBe(429);
    expect(vendor).not.toHaveBeenCalled();
  });

  it("starts the day's count at midnight on the phone's clock", async () => {
    const token = await registerDevice();
    const hash = await hashDeviceToken(token);
    const midnight = Date.parse(dayStartAtOffset(new Date(), 420));
    const fill = (at: number) =>
      env.DB.batch(
        Array.from({ length: 200 }, () =>
          env.DB.prepare(
            `INSERT INTO ai_usage (route, model, input_tokens, output_tokens, device_hash, created_at)
             VALUES ('voice.token', 'nova-3', 0, 0, ?, ?)`,
          ).bind(hash, new Date(at).toISOString()),
        ),
      );
    const inVietnam = { [UTC_OFFSET_HEADER]: '420' };
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(Response.json({ access_token: 'jwt-test', expires_in: 30 })),
    );

    await fill(midnight - 1);
    const yesterday = await mint(token, DEEPGRAM, undefined, inVietnam);
    expect(yesterday.status).toBe(200);

    await fill(midnight);
    const today = await mint(token, DEEPGRAM, undefined, inVietnam);
    expect(today.status).toBe(429);
  });
});
