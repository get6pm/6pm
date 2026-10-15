import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { nameMerchant, nameMerchantRequestSchema } from '../src/ai/name-merchant';
import { createApp } from '../src/app';
import { hashDeviceToken } from '../src/device-auth';
import * as routes from '../src/routes/index.generated';

import { anthropicAnswer, sentBody } from './anthropic-stand-in';
import { call, freshIp, registerDevice, wireErrorOf } from './support';

const receipt = {
  name: 'CIRCLE K VN',
  lines: ['Chuyển tiền thành công', 'Tên người nhận', 'CONG TY TNHH VONG TRON DO', 'Nội dung'],
  categories: ['Food', 'Shopping', 'Transport'],
};

/** A recorded Claude answer naming the merchant and category in `output`. */
function modelReplying(output: unknown): Response {
  return anthropicAnswer(output);
}

/** Sends a request with an Anthropic key set, so the route reaches the (recorded) model. */
async function callWithKey(token: string, body: unknown): Promise<Response> {
  const app = createApp(Object.values(routes));
  const ctx = createExecutionContext();
  const response = await app.fetch(
    new Request('https://6pm-dev.oddeggs.studio/api/v1/name-merchant', {
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /v1/name-merchant', () => {
  it('needs a registered device', async () => {
    const response = await call('/api/v1/name-merchant', { method: 'POST', body: receipt });
    expect(response.status).toBe(401);
  });

  it('turns away any digit without calling the model', async () => {
    const token = await registerDevice();
    const model = vi.spyOn(globalThis, 'fetch');
    for (const body of [
      { ...receipt, name: 'CIRCLE K 24' },
      { ...receipt, lines: [...receipt.lines, 'STK 0071000123456'] },
      { ...receipt, categories: ['Food', 'Tết 2027'] },
      { ...receipt, lines: ['Số tiền ١٢٠'] },
    ]) {
      const response = await callWithKey(token, body);
      expect(response.status).toBe(400);
      expect(await wireErrorOf(response)).toMatchObject({ code: 'bad_request' });
    }
    expect(model).not.toHaveBeenCalled();
  });

  it('answers with a merchant and one of the sent categories, and writes the cost ledger', async () => {
    const token = await registerDevice();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      modelReplying({ merchant: 'Circle K', category: 'Shopping' }),
    );
    const response = await callWithKey(token, receipt);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ merchant: 'Circle K', category: 'Shopping' });

    const { results } = await env.DB.prepare(
      "SELECT * FROM ai_usage WHERE route = 'name-merchant' AND device_hash = ?",
    )
      .bind(await hashDeviceToken(token))
      .all();
    expect(results).toEqual([
      expect.objectContaining({ model: 'claude-haiku-5-5', input_tokens: 210, output_tokens: 14 }),
    ]);
  });

  it('says the model is unavailable when it picks a category the user does not have', async () => {
    const token = await registerDevice();
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(modelReplying({ merchant: 'Circle K', category: 'Groceries' })),
    );
    const response = await callWithKey(token, receipt);
    expect(response.status).toBe(503);
    expect(await wireErrorOf(response)).toMatchObject({ code: 'model_unavailable' });
  });
});

describe('the naming contract', () => {
  it('asks for output with only the sent categories as choices, and sends no digit', async () => {
    const send = vi.fn<typeof fetch>(() =>
      Promise.resolve(modelReplying({ merchant: 'Circle K', category: 'Food' })),
    );
    await nameMerchant({ apiKey: 'test', fetch: send }, nameMerchantRequestSchema.parse(receipt));
    const body = sentBody(send.mock.calls[0]?.[1]) as {
      model: string;
      output_config: { format: { schema: { properties: { category: unknown } } } };
      messages: { content: string }[];
    };
    expect(body.model).toBe('claude-haiku-5-5');
    // The SDK carries the choices in the schema (as a description); zod holds the answer to them.
    const category = JSON.stringify(body.output_config.format.schema.properties.category);
    for (const name of receipt.categories) expect(category).toContain(name);
    expect(body.messages[0]?.content).not.toMatch(/\d/);
  });

  it('refuses a merchant longer than a name', async () => {
    await expect(
      nameMerchant(
        {
          apiKey: 'test',
          fetch: () =>
            Promise.resolve(modelReplying({ merchant: 'x'.repeat(61), category: 'Food' })),
        },
        nameMerchantRequestSchema.parse(receipt),
      ),
    ).rejects.toMatchObject({ code: 'model_unavailable' });
  });
});
