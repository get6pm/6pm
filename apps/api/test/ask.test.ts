import { describe, expect, it } from 'vitest';

import { askResponseSchema } from '@6pm/domain';

import { generate } from '../src/ai/anthropic';

import { anthropicAnswer } from './anthropic-stand-in';
import { call, registerDevice, wireErrorOf } from './support';

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

const request = {
  system: 'Read the question.',
  prompt: 'Can I afford 2tr on Saturday?',
  schema: askResponseSchema,
  maxTokens: 1_024,
  timeoutMs: 3_000,
} as const;

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
});

describe('reading a question with the model', () => {
  it('accepts an intent that matches the contract', async () => {
    const result = await generate(
      { apiKey: 'test', fetch: modelReplying({ intent: { kind: 'afford', amount: 2_000_000 } }) },
      request,
    );
    expect(result.output).toEqual({ intent: { kind: 'afford', amount: 2_000_000 } });
    expect(result.inputTokens).toBe(120);
  });

  it('refuses an answer outside the contract', async () => {
    await expect(
      generate(
        { apiKey: 'test', fetch: modelReplying({ intent: { kind: 'afford', amount: -5 } }) },
        request,
      ),
    ).rejects.toMatchObject({ code: 'model_unavailable' });
  });

  it('treats a decline as the model being unavailable, so the phone reads it itself', async () => {
    await expect(
      generate({ apiKey: 'test', fetch: modelReplying(null, 'refusal') }, request),
    ).rejects.toMatchObject({ code: 'model_unavailable' });
  });
});
