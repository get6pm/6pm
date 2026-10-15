import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { askRequestSchema, readQuestionPrompt, readQuestionSystem } from '@6pm/domain';

import { readQuestion } from '../src/ai/read-question';
import { createApp } from '../src/app';
import { hashDeviceToken } from '../src/device-auth';
import * as routes from '../src/routes/index.generated';

import { anthropicAnswer, sentBody } from './anthropic-stand-in';
import { call, freshIp, registerDevice, wireErrorOf } from './support';

/** A recorded Claude answer whose output is `output`. */
function modelReplying(output: unknown, stopReason?: string): typeof fetch {
  return () =>
    Promise.resolve(
      anthropicAnswer(output, {
        inputTokens: 120,
        outputTokens: 18,
        ...(stopReason ? { stopReason } : {}),
      }),
    );
}

/** Sends a question with an Anthropic key set, so the route reaches the (recorded) model. */
async function ask(token: string, body: unknown): Promise<Response> {
  const app = createApp(Object.values(routes));
  const ctx = createExecutionContext();
  const response = await app.fetch(
    new Request('https://6pm-dev.oddeggs.studio/api/v1/ask', {
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

const spendQuery = { kind: 'spend', range: { preset: 'thisWeek' }, category: 'Cà phê' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /v1/ask', () => {
  it('needs a registered device', async () => {
    const response = await call('/api/v1/ask', { method: 'POST', body: { question: 'hi' } });
    expect(response.status).toBe(401);
  });

  it('turns away an empty question without calling the model', async () => {
    const token = await registerDevice();
    const response = await call('/api/v1/ask', { method: 'POST', token, body: { question: ' ' } });
    expect(response.status).toBe(400);
  });

  it('says the model is unavailable, retryably, when no key is set', async () => {
    const token = await registerDevice();
    const response = await call('/api/v1/ask', {
      method: 'POST',
      token,
      body: { question: 'Can I afford 2tr?' },
    });
    expect(response.status).toBe(503);
    expect(await wireErrorOf(response)).toMatchObject({
      code: 'model_unavailable',
      retryable: true,
    });
  });

  it('answers a query, with the intent older phones read, and writes the cost ledger', async () => {
    const token = await registerDevice();
    vi.spyOn(globalThis, 'fetch').mockImplementation(modelReplying({ query: spendQuery }));
    const response = await ask(token, {
      question: 'tuần này cà phê hết bao nhiêu',
      categories: ['Ăn uống', 'Cà phê'],
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ intent: { kind: 'unknown' }, query: spendQuery });

    const { results } = await env.DB.prepare(
      "SELECT model, input_tokens FROM ai_usage WHERE route = 'ask.read' AND device_hash = ?",
    )
      .bind(await hashDeviceToken(token))
      .all();
    expect(results).toEqual([{ model: 'claude-haiku-5-5', input_tokens: 120 }]);
  });

  it('gives an original intent to older phones as it is', async () => {
    const token = await registerDevice();
    const afford = { kind: 'afford', amount: 2_000_000 };
    vi.spyOn(globalThis, 'fetch').mockImplementation(modelReplying({ query: afford }));
    const response = await ask(token, { question: 'Can I afford 2tr on Saturday?' });
    expect(await response.json()).toEqual({ intent: afford, query: afford });
  });

  it('stops a device that has used its day of questions, without calling the model', async () => {
    const token = await registerDevice();
    const hash = await hashDeviceToken(token);
    const now = new Date().toISOString();
    await env.DB.batch(
      Array.from({ length: 60 }, () =>
        env.DB.prepare(
          `INSERT INTO ai_usage (route, model, input_tokens, output_tokens, device_hash, created_at)
           VALUES ('ask.read', 'claude-haiku-5-5', 1, 1, ?, ?)`,
        ).bind(hash, now),
      ),
    );
    const model = vi.spyOn(globalThis, 'fetch');
    const response = await ask(token, { question: 'How am I doing?' });
    expect(response.status).toBe(429);
    expect(model).not.toHaveBeenCalled();
  });
});

describe('reading a question with the model', () => {
  const request = askRequestSchema.parse({
    question: 'what about last month?',
    today: '2026-10-09',
    categories: ['Ăn uống', 'Cà phê'],
    pots: ['Đà Lạt'],
    previous: spendQuery,
  });

  it('sends the question with the names, the day and the previous query, and nothing else', async () => {
    const send = vi.fn<typeof fetch>(modelReplying({ query: spendQuery }));
    await readQuestion({ apiKey: 'test', fetch: send }, request);
    const body = sentBody(send.mock.calls[0]?.[1]) as { messages: { content: string }[] };
    expect(body.messages[0]?.content).toBe(readQuestionPrompt(request));
    expect(readQuestionPrompt(request)).toContain('Their categories: Ăn uống | Cà phê');
    expect(readQuestionPrompt(request)).toContain('Previous query: {"kind":"spend"');
  });

  it('refuses a query outside the contract', async () => {
    await expect(
      readQuestion(
        { apiKey: 'test', fetch: modelReplying({ query: { kind: 'afford', amount: -5 } }) },
        request,
      ),
    ).rejects.toMatchObject({ code: 'model_unavailable' });
  });

  it('reads đồng with the rules it always had when the phone names no currency', async () => {
    const send = vi.fn<typeof fetch>(modelReplying({ query: spendQuery }));
    await readQuestion({ apiKey: 'test', fetch: send }, request);
    const body = sentBody(send.mock.calls[0]?.[1]) as { system: string };
    expect(body.system).toBe(readQuestionSystem);
  });

  it('reads amounts in the home currency, and answers in its minor units', async () => {
    const dollars = askRequestSchema.parse({
      question: 'Can I afford $3.50 on coffee?',
      currency: 'USD',
      previous: { kind: 'list', range: { preset: 'thisWeek' }, minAmount: 2_000 },
    });
    const send = vi.fn<typeof fetch>(modelReplying({ query: { kind: 'afford', amount: 3.5 } }));
    const read = await readQuestion({ apiKey: 'test', fetch: send }, dollars);
    expect(read.output.query).toEqual({ kind: 'afford', amount: 350 });
    expect(read.output.intent).toEqual({ kind: 'afford', amount: 350 });
    const body = sentBody(send.mock.calls[0]?.[1]) as {
      system: string;
      messages: { content: string }[];
    };
    expect(body.system).toContain('amount in USD');
    expect(body.system).not.toContain('đồng');
    // The previous query goes to the model in dollars, as it reads them.
    expect(body.messages[0]?.content).toContain('"minAmount":20');
  });

  it('refuses a home-currency amount that rounds to nothing', async () => {
    await expect(
      readQuestion(
        {
          apiKey: 'test',
          fetch: modelReplying({ query: { kind: 'afford', amount: 0.001 } }),
        },
        askRequestSchema.parse({ question: 'Can I afford a tenth of a cent?', currency: 'USD' }),
      ),
    ).rejects.toMatchObject({ code: 'model_unavailable' });
  });

  it('treats a decline as the model being unavailable, so the phone reads it itself', async () => {
    await expect(
      readQuestion({ apiKey: 'test', fetch: modelReplying(null, 'refusal') }, request),
    ).rejects.toMatchObject({ code: 'model_unavailable' });
  });
});
