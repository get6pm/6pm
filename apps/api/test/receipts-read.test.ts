import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  RECEIPT_READ_MAX_BODY_BYTES,
  RECEIPT_READ_MAX_IMAGE_CHARS,
  receiptMinorUnits,
} from '@6pm/domain';

import { readReceipt, toReceiptReading, type ReceiptModelOutput } from '../src/ai/read-receipt';
import { createApp } from '../src/app';
import { hashDeviceToken } from '../src/device-auth';
import * as routes from '../src/routes/index.generated';

import { freshIp, registerDevice, wireErrorOf } from './support';

/** The first bytes of a JPEG, base64: enough for the route, which never decodes the photo. */
const jpeg = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U';
const body = { image: jpeg, language: 'vi' as const, currencyHint: null };

const grabReceipt: ReceiptModelOutput = {
  isReceipt: true,
  total: '101.500',
  currency: 'VND',
  merchant: 'Cơm Gà Hải Nam',
  at: '2026-09-30T18:47:00',
  sure: true,
  currencyPrinted: true,
};

/** A recorded Messages API answer. */
function modelAnswer(
  output: unknown,
  { stopReason = 'end_turn', model = 'claude-haiku-5-5' } = {},
): Response {
  return Response.json({
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model,
    content: stopReason === 'refusal' ? [] : [{ type: 'text', text: JSON.stringify(output) }],
    stop_reason: stopReason,
    stop_sequence: null,
    usage: { input_tokens: 3_700, output_tokens: 75 },
  });
}

/** Sends a read with an Anthropic key set, so the route reaches the (recorded) model. */
async function read(
  token: string | undefined,
  payload: unknown,
  { ip = freshIp(), key = 'test', raw }: { ip?: string; key?: string; raw?: string } = {},
): Promise<Response> {
  const app = createApp(Object.values(routes));
  const ctx = createExecutionContext();
  const headers = new Headers({ 'CF-Connecting-IP': ip, 'Content-Type': 'application/json' });
  if (token !== undefined) headers.set('Authorization', `Bearer ${token}`);
  const response = await app.fetch(
    new Request('https://6pm-dev.oddeggs.studio/api/v1/receipts/read', {
      method: 'POST',
      headers,
      body: raw ?? JSON.stringify(payload),
    }),
    { ...env, ANTHROPIC_API_KEY: key },
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return response;
}

async function ledgerRows(token: string) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM ai_usage WHERE route = 'receipts.read' AND device_hash = ?",
  )
    .bind(await hashDeviceToken(token))
    .all();
  return results;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /v1/receipts/read', () => {
  it('needs a registered device', async () => {
    const model = vi.spyOn(globalThis, 'fetch');
    expect((await read(undefined, body)).status).toBe(401);
    expect((await read('x'.repeat(43), body)).status).toBe(401);
    expect(model).not.toHaveBeenCalled();
  });

  it('turns away a photo over the size limit before reading it', async () => {
    const token = await registerDevice();
    const model = vi.spyOn(globalThis, 'fetch');
    const oversize = await read(token, {
      ...body,
      image: `/9j/${'A'.repeat(RECEIPT_READ_MAX_BODY_BYTES)}`,
    });
    expect(oversize.status).toBe(400);
    expect(await wireErrorOf(oversize)).toMatchObject({ detail: { reason: 'too_large' } });
    // Just over the photo's own limit, though the body would fit.
    const photo = await read(token, {
      ...body,
      image: `/9j/${'A'.repeat(RECEIPT_READ_MAX_IMAGE_CHARS)}`,
    });
    expect(photo.status).toBe(400);
    expect(await wireErrorOf(photo)).toMatchObject({ detail: { issues: [{ path: 'image' }] } });
    expect(model).not.toHaveBeenCalled();
  });

  it('turns away anything but a base64 JPEG, a language and a currency code', async () => {
    const token = await registerDevice();
    const model = vi.spyOn(globalThis, 'fetch');
    for (const payload of [
      { ...body, image: `data:image/jpeg;base64,${jpeg}` },
      { ...body, image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB' },
      { ...body, image: `${jpeg}!` },
      { ...body, language: 'fr' },
      { ...body, currencyHint: 'sgd' },
      { image: jpeg, language: 'en' },
    ]) {
      const response = await read(token, payload);
      expect(response.status).toBe(400);
      expect(await wireErrorOf(response)).toMatchObject({ code: 'bad_request' });
    }
    expect((await read(token, null, { raw: '{"image":' })).status).toBe(400);
    expect(model).not.toHaveBeenCalled();
  });

  it('answers with the reading in minor units and writes the cost ledger', async () => {
    const token = await registerDevice();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(modelAnswer(grabReceipt));
    const response = await read(token, body);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      receipt: {
        amount: 101_500,
        currency: 'VND',
        merchant: 'Cơm Gà Hải Nam',
        at: '2026-09-30T18:47:00',
        sure: true,
        currencyPrinted: true,
      },
    });
    expect(await ledgerRows(token)).toEqual([
      expect.objectContaining({
        model: 'claude-haiku-5-5',
        input_tokens: 3_700,
        output_tokens: 75,
      }),
    ]);
  });

  it('answers null when the model declines, and still writes the ledger', async () => {
    const token = await registerDevice();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(modelAnswer(null, { stopReason: 'refusal' }));
    const response = await read(token, body);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ receipt: null });
    expect(await ledgerRows(token)).toHaveLength(1);
  });

  it('says the model is unavailable when no key is set or it answers outside the schema', async () => {
    const token = await registerDevice();
    const noKey = await read(token, body, { key: '' });
    expect(noKey.status).toBe(503);
    expect(await wireErrorOf(noKey)).toMatchObject({ detail: { reason: 'missing_key' } });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(modelAnswer({ total: 5 }));
    const invalid = await read(token, body);
    expect(invalid.status).toBe(503);
    expect(await wireErrorOf(invalid)).toMatchObject({ detail: { reason: 'invalid_output' } });
  });

  it('stops one device after its allowance', async () => {
    const token = await registerDevice();
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 12; attempt += 1) {
      statuses.push((await read(token, body, { key: '' })).status);
    }
    expect(statuses.slice(0, 10).every((status) => status === 503)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });

  it('counts one address across devices', async () => {
    const ip = freshIp();
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 12; attempt += 1) {
      statuses.push((await read(await registerDevice(), body, { ip, key: '' })).status);
    }
    expect(statuses.at(-1)).toBe(429);
  });
});

describe('the request to the model', () => {
  it('sends the photo first and asks for the schema at low effort, on Haiku', async () => {
    const send = vi.fn<typeof fetch>(() => Promise.resolve(modelAnswer(grabReceipt)));
    await readReceipt({ apiKey: 'test', fetch: send }, { ...body, language: 'en' });
    const [url, init] = send.mock.calls[0] ?? [];
    expect(url).toBe('https://api.anthropic.com/v1/messages?beta=true');
    expect(new Headers(init?.headers).get('anthropic-beta')).toBeNull();
    const sent = JSON.parse(typeof init?.body === 'string' ? init.body : 'null') as Record<
      string,
      unknown
    > & { messages: { content: { type: string; source?: unknown }[] }[] };
    expect(sent).toMatchObject({
      model: 'claude-haiku-5-5',
      output_config: { effort: 'low', format: { type: 'json_schema' } },
    });
    expect(sent).not.toHaveProperty('fallbacks');
    expect(sent).not.toHaveProperty('thinking');
    expect(sent).not.toHaveProperty('tool_choice');
    expect(sent.messages[0]?.content.map((block) => block.type)).toEqual(['image', 'text']);
    expect(sent.messages[0]?.content[0]?.source).toEqual({
      type: 'base64',
      media_type: 'image/jpeg',
      data: jpeg,
    });
  });

  it('opts into the server-side fallback on a model that has one', async () => {
    const send = vi.fn<typeof fetch>(() => Promise.resolve(modelAnswer(grabReceipt)));
    await readReceipt({ apiKey: 'test', fetch: send }, body, 'claude-opus-5-5');
    const [, init] = send.mock.calls[0] ?? [];
    expect(new Headers(init?.headers).get('anthropic-beta')).toBe(
      'server-side-fallback-2026-07-01',
    );
    const sent = JSON.parse(typeof init?.body === 'string' ? init.body : 'null') as unknown;
    expect(sent).toMatchObject({ model: 'claude-opus-5-5', fallbacks: 'default' });
  });

  it('tries once more when the provider is busy', async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ type: 'error' }, { status: 529, headers: { 'retry-after-ms': '0' } }),
      )
      .mockResolvedValueOnce(modelAnswer(grabReceipt));
    const result = await readReceipt({ apiKey: 'test', fetch: send }, body);
    expect(result.output?.amount).toBe(101_500);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('does not try again when the request itself is refused', async () => {
    const send = vi.fn<typeof fetch>(() =>
      Promise.resolve(Response.json({ type: 'error' }, { status: 400 })),
    );
    await expect(readReceipt({ apiKey: 'test', fetch: send }, body)).rejects.toMatchObject({
      code: 'model_unavailable',
      detail: { reason: 'http_400' },
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('fails when the answer was cut off', async () => {
    const send = () => Promise.resolve(modelAnswer(grabReceipt, { stopReason: 'max_tokens' }));
    await expect(readReceipt({ apiKey: 'test', fetch: send }, body)).rejects.toMatchObject({
      detail: { reason: 'stop_max_tokens' },
    });
  });
});

describe('turning the printed total into minor units', () => {
  it('reads whole currencies as written and others in cents', () => {
    expect(receiptMinorUnits('101.500', 'VND')).toBe(101_500);
    expect(receiptMinorUnits('1,250,000', 'VND')).toBe(1_250_000);
    expect(receiptMinorUnits('Rp935.550', 'IDR')).toBe(935_550);
    expect(receiptMinorUnits('¥1,200', 'JPY')).toBe(1_200);
    expect(receiptMinorUnits('S$68.80', 'SGD')).toBe(6_880);
    expect(receiptMinorUnits('1,234.5', 'USD')).toBe(123_450);
    expect(receiptMinorUnits('45.000,00', 'EUR')).toBe(4_500_000);
    expect(receiptMinorUnits('12', 'THB')).toBe(1_200);
  });

  it('refuses what is not a positive amount', () => {
    for (const printed of ['', 'Total', '0', '0.00', '1.2.3', '12,']) {
      expect(receiptMinorUnits(printed, 'VND')).toBeNull();
    }
  });
});

describe('the reading from the model output', () => {
  it('falls back to the hint, then to đồng, and is then not sure', () => {
    const noCurrency = { ...grabReceipt, total: '68.80', currency: null };
    expect(toReceiptReading(noCurrency, 'SGD')).toMatchObject({
      amount: 6_880,
      currency: 'SGD',
      sure: false,
    });
    expect(toReceiptReading({ ...noCurrency, total: '50.000' }, null)).toMatchObject({
      amount: 50_000,
      currency: 'VND',
      sure: false,
    });
    expect(
      toReceiptReading({ ...grabReceipt, currency: 'sgd', total: '68.80' }, null),
    ).toMatchObject({ amount: 6_880, currency: 'SGD', sure: true });
  });

  it('says whether the currency was printed, never for one taken from the hint', () => {
    expect(toReceiptReading(grabReceipt, null)?.currencyPrinted).toBe(true);
    const inferred = { ...grabReceipt, total: '368,160', currency: 'IDR', currencyPrinted: false };
    expect(toReceiptReading(inferred, 'VND')).toMatchObject({
      currency: 'IDR',
      currencyPrinted: false,
    });
    const hinted = { ...grabReceipt, total: '368,160', currency: null };
    expect(toReceiptReading(hinted, 'IDR')).toMatchObject({ currencyPrinted: false });
  });

  it('drops a time that is not a printed local time and an empty merchant', () => {
    expect(
      toReceiptReading({ ...grabReceipt, at: '2026-09-30T18:47:00Z', merchant: ' ' }, null),
    ).toMatchObject({ at: null, merchant: null });
    expect(toReceiptReading({ ...grabReceipt, at: '2026-13-45T25:00:00' }, null)?.at).toBeNull();
  });

  it('has no reading for a photo that is not a receipt or has no readable total', () => {
    expect(toReceiptReading({ ...grabReceipt, isReceipt: false }, null)).toBeNull();
    expect(toReceiptReading({ ...grabReceipt, total: null }, null)).toBeNull();
    expect(toReceiptReading({ ...grabReceipt, total: 'illegible' }, null)).toBeNull();
  });
});
