import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { wordPrompt, wordRequestSchema } from '@6pm/domain';

import { createApp } from '../src/app';
import { hashDeviceToken } from '../src/device-auth';
import * as routes from '../src/routes/index.generated';

import { anthropicAnswer, sentBody } from './anthropic-stand-in';
import { call, freshIp, registerDevice, wireErrorOf } from './support';

const request = {
  surface: 'bubble',
  language: 'en',
  persona: 'cheeky',
  facts: [
    {
      kind: 'repeatMerchant',
      slots: [
        { name: 'merchant', value: 'Highlands' },
        { name: 'visits', value: '4' },
        { name: 'amount', value: '236k' },
      ],
    },
  ],
};

/** Sends a request with an Anthropic key set, so the route reaches the (recorded) model. */
async function word(token: string, body: unknown): Promise<Response> {
  const app = createApp(Object.values(routes));
  const ctx = createExecutionContext();
  const response = await app.fetch(
    new Request('https://6pm-dev.oddeggs.studio/api/v1/word', {
      method: 'POST',
      headers: {
        'CF-Connecting-IP': freshIp(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }),
    { ...env, ANTHROPIC_API_KEY: 'test' },
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return response;
}

/** The model answers with each line in turn. */
function modelSaying(...texts: string[]) {
  const send = vi.spyOn(globalThis, 'fetch');
  for (const text of texts) {
    send.mockResolvedValueOnce(anthropicAnswer({ text, mood: 'think' }));
  }
  return send;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /v1/word', () => {
  it('needs a registered device', async () => {
    const response = await call('/api/v1/word', { method: 'POST', body: request });
    expect(response.status).toBe(401);
  });

  it('turns away what is not a fact, without calling the model', async () => {
    const token = await registerDevice();
    const model = vi.spyOn(globalThis, 'fetch');
    const fact = request.facts[0];
    for (const body of [
      { ...request, facts: [{ ...fact, kind: 'ledger' }] },
      { ...request, facts: [{ ...fact, slots: [{ name: 'note', value: 'x'.repeat(41) }] }] },
      { ...request, facts: [fact, fact] },
      { ...request, facts: [] },
    ]) {
      const response = await word(token, body);
      expect(response.status).toBe(400);
    }
    expect(model).not.toHaveBeenCalled();
  });

  it('answers a line with placeholders and writes the cost ledger', async () => {
    const token = await registerDevice();
    modelSaying('{merchant} again? That’s {visits} since Monday ☕');
    const response = await word(token, request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      text: '{merchant} again? That’s {visits} since Monday ☕',
      mood: 'think',
    });
    const { results } = await env.DB.prepare(
      'SELECT route, model FROM ai_usage WHERE device_hash = ?',
    )
      .bind(await hashDeviceToken(token))
      .all();
    expect(results).toEqual([{ route: 'word.companion', model: 'claude-haiku-5-5' }]);
  });

  it('asks once more after a line that fails the check, then gives up', async () => {
    const token = await registerDevice();
    // A number the model wrote itself, then a line in the wrong language.
    const send = modelSaying('Highlands again? That’s 4 since Monday', '{merchant} nữa hả bạn?');
    const response = await word(token, request);
    expect(response.status).toBe(503);
    expect(await wireErrorOf(response)).toMatchObject({ code: 'model_unavailable' });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('uses the second line when it passes', async () => {
    const token = await registerDevice();
    modelSaying('That’s 4 since Monday', 'Another {merchant} run 👀');
    const response = await word(token, request);
    expect(await response.json()).toEqual({ text: 'Another {merchant} run 👀', mood: 'think' });
  });

  it('stops a device that has worded its day of lines, without calling the model', async () => {
    const token = await registerDevice();
    const hash = await hashDeviceToken(token);
    const now = new Date().toISOString();
    await env.DB.batch(
      Array.from({ length: 40 }, (_, i) =>
        env.DB.prepare(
          `INSERT INTO ai_usage (route, model, input_tokens, output_tokens, device_hash, created_at)
           VALUES (?, 'claude-haiku-5-5', 1, 1, ?, ?)`,
        ).bind(i % 2 === 0 ? 'word.ask' : 'word.companion', hash, now),
      ),
    );
    const model = vi.spyOn(globalThis, 'fetch');
    const response = await word(token, request);
    expect(response.status).toBe(429);
    expect(model).not.toHaveBeenCalled();
  });
});

describe('the wording prompt', () => {
  it('gives the voice, the length, the companion and each placeholder with its value', async () => {
    const parsed = wordRequestSchema.parse({
      ...request,
      language: 'vi',
      companion: { name: 'Bánh Bao', personality: 'Soft and round, loves a snack.' },
    });
    const prompt = wordPrompt(parsed, 140);
    expect(prompt).toContain('Language: Vietnamese');
    expect(prompt).toContain('at most 140 characters');
    expect(prompt).toContain('You are Bánh Bao: Soft and round, loves a snack.');
    expect(prompt).toContain('{merchant} = Highlands');

    const token = await registerDevice();
    const send = modelSaying('Lại {merchant} nữa hả bạn?');
    await word(token, parsed);
    const body = sentBody(send.mock.calls[0]?.[1]) as { messages: { content: string }[] };
    expect(body.messages[0]?.content).toBe(prompt);
  });
});
