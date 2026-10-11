import { describe, expect, it } from 'vitest';

import { askResponseSchema } from '@6pm/domain';

import { generate } from '../src/ai/deepseek';

import { call, registerDevice, wireErrorOf } from './support';

/** A recorded DeepSeek answer that calls the tool with `input`. */
function modelReplying(input: unknown): typeof fetch {
  return () =>
    Promise.resolve(
      Response.json({
        model: 'deepseek-flash',
        content: [{ type: 'tool_use', name: 'read_question', input }],
        usage: { input_tokens: 120, output_tokens: 18 },
      }),
    );
}

const request = {
  tier: 'fast',
  system: 'Read the question.',
  prompt: 'Can I afford 2tr on Saturday?',
  tool: { name: 'read_question', description: 'What the question is about.' },
  schema: askResponseSchema,
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
});
