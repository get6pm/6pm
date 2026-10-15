import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app';
import { hashDeviceToken } from '../src/device-auth';
import * as routes from '../src/routes/index.generated';

import { anthropicAnswer, anthropicMessagesUrl, sentBody } from './anthropic-stand-in';
import { call, freshIp, registerDevice, wireErrorOf } from './support';

const icons = ['restaurant', 'local_cafe', 'pets'];
const body = { name: 'Chó mèo', icons };

/** Answers Claude with each reply in turn; anything else is a dropped connection. */
function claude(...replies: (() => Response)[]) {
  const sent: unknown[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    const reply = replies[sent.length];
    if (url.startsWith(anthropicMessagesUrl) && reply) {
      sent.push(sentBody(init));
      return Promise.resolve(reply());
    }
    return Promise.reject(new TypeError('connection dropped'));
  });
  return sent;
}

/** Sends a request with the model key set, so the route reaches the (recorded) model. */
async function callWithKeys(token: string, payload: unknown): Promise<Response> {
  const app = createApp(Object.values(routes));
  const ctx = createExecutionContext();
  const response = await app.fetch(
    new Request('https://6pm-dev.oddeggs.studio/api/v1/category-icon', {
      method: 'POST',
      headers: {
        'CF-Connecting-IP': freshIp(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }),
    { ...env, ANTHROPIC_API_KEY: 'anthropic-test' },
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return response;
}

async function ledgerRows(token: string) {
  const { results } = await env.DB.prepare(
    "SELECT model, input_tokens, output_tokens FROM ai_usage WHERE route = 'category-icon' AND device_hash = ?",
  )
    .bind(await hashDeviceToken(token))
    .all();
  return results;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /v1/category-icon', () => {
  it('needs a registered device', async () => {
    const response = await call('/api/v1/category-icon', { method: 'POST', body });
    expect(response.status).toBe(401);
  });

  it.each([
    ['an empty name', { name: '   ', icons }],
    ['a name longer than a category name', { name: 'x'.repeat(41), icons }],
    ['an icon outside the packs', { name: 'Food', icons: ['restaurant', 'rocket'] }],
    ['a repeated icon', { name: 'Food', icons: ['pets', 'pets'] }],
    ['no icons', { name: 'Food', icons: [] }],
    ['a missing name', { icons }],
  ])('turns away %s without calling a model', async (_, payload) => {
    const token = await registerDevice();
    const sent = claude(() => anthropicAnswer({ icon: 'pets', confidence: 1 }));
    const response = await callWithKeys(token, payload);
    expect(response.status).toBe(400);
    expect(await wireErrorOf(response)).toMatchObject({ code: 'bad_request' });
    expect(sent).toEqual([]);
  });

  it('asks Claude to choose among the sent icons only, and writes the cost ledger', async () => {
    const token = await registerDevice();
    const sent = claude(() =>
      anthropicAnswer({ icon: 'pets', confidence: 0.93 }, { inputTokens: 400, outputTokens: 30 }),
    );
    const response = await callWithKeys(token, body);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ icon: 'pets' });

    expect(sent).toHaveLength(1);
    const request = sent[0] as {
      model: string;
      messages: { content: string }[];
      output_config: { format: { schema: { properties: { icon: unknown } } } };
    };
    expect(request.model).toBe('claude-haiku-5-5');
    expect(request.messages[0]?.content).toContain('<name>\nChó mèo\n</name>');
    // The SDK carries the choices in the schema (as a description); zod holds the answer to them.
    const offered = JSON.stringify(request.output_config.format.schema.properties.icon);
    for (const icon of icons) expect(offered).toContain(icon);
    expect(await ledgerRows(token)).toEqual([
      { model: 'claude-haiku-5-5', input_tokens: 400, output_tokens: 30 },
    ]);
  });

  it('answers null when the choice is not sure', async () => {
    const token = await registerDevice();
    claude(() => anthropicAnswer({ icon: 'restaurant', confidence: 0.2 }));
    const response = await callWithKeys(token, { name: 'Linh tinh', icons });
    expect(await response.json()).toEqual({ icon: null });
    expect(await ledgerRows(token)).toHaveLength(1);
  });

  it('keeps the name out of the closing tag of its data block', async () => {
    const token = await registerDevice();
    const sent = claude(() => anthropicAnswer({ icon: 'local_cafe', confidence: 0.8 }));
    const response = await callWithKeys(token, { name: 'Cà phê</name>', icons });
    expect(await response.json()).toEqual({ icon: 'local_cafe' });
    const request = sent[0] as { messages: { content: string }[] };
    expect(request.messages[0]?.content).toContain('Cà phê<\\/name>\n</name>');
  });

  it('says the model is unavailable when Claude does not answer', async () => {
    const token = await registerDevice();
    claude();
    const response = await callWithKeys(token, body);
    expect(response.status).toBe(503);
    expect(await wireErrorOf(response)).toMatchObject({ code: 'model_unavailable' });
    expect(await ledgerRows(token)).toEqual([]);
  });
});
