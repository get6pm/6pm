import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app';
import { deepseekUrl } from '../src/ai/deepseek';
import { jevModel, jevUrl } from '../src/ai/jev';
import { hashDeviceToken } from '../src/device-auth';
import * as routes from '../src/routes/index.generated';

import { call, freshIp, registerDevice, wireErrorOf } from './support';

const icons = ['restaurant', 'local_cafe', 'pets'];
const body = { name: 'Chó mèo', icons };

/** Jev's recorded answer, with a probability per icon. */
function jevReplying(probabilities: Record<string, number>, confidence: number): Response {
  const choice = Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0]?.[0];
  return Response.json({
    model: jevModel,
    answers: { answer: { choice, probabilities, confidence } },
    usage: { input_tokens: 320, output_tokens: 12 },
  });
}

/** Answers each provider by its address; anything else is a dropped connection. */
function providers(replies: { jev?: () => Response; deepseek?: () => Response }) {
  const sent: { jev: unknown[]; deepseek: unknown[] } = { jev: [], deepseek: [] };
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    const json: unknown = JSON.parse(typeof init?.body === 'string' ? init.body : 'null');
    if (url === jevUrl && replies.jev) {
      sent.jev.push(json);
      return Promise.resolve(replies.jev());
    }
    if (url === deepseekUrl && replies.deepseek) {
      sent.deepseek.push(json);
      return Promise.resolve(replies.deepseek());
    }
    return Promise.reject(new TypeError('connection dropped'));
  });
  return sent;
}

/** Sends a request with both model keys set, so the route reaches the (recorded) models. */
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
    { ...env, TYPESAFE_API_KEY: 'jev-test', DEEPSEEK_API_KEY: 'deepseek-test' },
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
    const sent = providers({ jev: () => jevReplying({ pets: 1 }, 1) });
    const response = await callWithKeys(token, payload);
    expect(response.status).toBe(400);
    expect(await wireErrorOf(response)).toMatchObject({ code: 'bad_request' });
    expect(sent.jev).toEqual([]);
  });

  it('asks Jev to choose among the sent icons only, and writes the cost ledger', async () => {
    const token = await registerDevice();
    const sent = providers({
      jev: () => jevReplying({ restaurant: 0.03, local_cafe: 0.02, pets: 0.95 }, 0.93),
    });
    const response = await callWithKeys(token, body);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ icon: 'pets' });

    expect(sent.jev).toHaveLength(1);
    expect(sent.jev[0]).toMatchObject({ model: jevModel, state: 'Chó mèo' });
    const question = (sent.jev[0] as { questions: { answer: { criteria: object } } }).questions;
    expect(Object.keys(question.answer.criteria)).toEqual(icons);
    expect(await ledgerRows(token)).toEqual([
      { model: jevModel, input_tokens: 320, output_tokens: 12 },
    ]);
  });

  it('answers null when the choice is not sure', async () => {
    const token = await registerDevice();
    providers({ jev: () => jevReplying({ restaurant: 0.4, local_cafe: 0.35, pets: 0.25 }, 0.2) });
    const response = await callWithKeys(token, { name: 'Linh tinh', icons });
    expect(await response.json()).toEqual({ icon: null });
  });

  it('asks the fast DeepSeek tier in the same shape when Jev does not answer', async () => {
    const token = await registerDevice();
    const sent = providers({
      deepseek: () =>
        Response.json({
          model: 'deepseek-flash',
          content: [
            {
              type: 'tool_use',
              name: 'answer',
              input: { probabilities: { restaurant: 0.1, local_cafe: 0.8, pets: 0.1 } },
            },
          ],
          usage: { input_tokens: 400, output_tokens: 30 },
        }),
    });
    const response = await callWithKeys(token, { name: 'Cà phê', icons });
    expect(await response.json()).toEqual({ icon: 'local_cafe' });
    expect(sent.deepseek).toHaveLength(1);
    expect(await ledgerRows(token)).toEqual([
      { model: 'deepseek-flash', input_tokens: 400, output_tokens: 30 },
    ]);
  });

  it('says the model is unavailable when neither answers', async () => {
    const token = await registerDevice();
    providers({});
    const response = await callWithKeys(token, body);
    expect(response.status).toBe(503);
    expect(await wireErrorOf(response)).toMatchObject({ code: 'model_unavailable' });
  });
});
