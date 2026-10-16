import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { emailCapturesResponseSchema, emailHandleResponseSchema } from '@6pm/domain';

import { hashDeviceToken } from '../src/device-auth';
import { EMAIL_MODEL_READS_PER_DAY } from '../src/receipt-email/read-spend';
import { receiveEmail, type InboundEmail } from '../src/receipt-email/receive';

import { anthropicAnswer, sentBody } from './anthropic-stand-in';
import { call, registerDevice } from './support';

const NOW = new Date('2026-10-16T05:00:00.000Z');
const withKey = { ...env, ANTHROPIC_API_KEY: 'test' };

/** A synthetic card alert in the shape Vietcombank sends; no real card or person in it. */
const cardAlert = [
  'From: Vietcombank <info@info.vietcombank.com.vn>',
  'To: someone@example.com',
  'Subject: Thong bao giao dich the',
  'Date: Fri, 16 Oct 2026 10:25:38 +0700',
  'Message-ID: <card-1@info.vietcombank.com.vn>',
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'The: Visa 400000...0001',
  'Su dung tai: APPLE.COM/US US',
  'So tien: 99 USD',
  'Ngay, gio giao dich: 16-10-2026 10:25:31',
  '',
].join('\r\n');

function inbound(to: string, raw: string): InboundEmail {
  return {
    to,
    rawSize: raw.length,
    raw: new Response(raw).body as ReadableStream<Uint8Array>,
    setReject: () => undefined,
  };
}

async function phone() {
  const token = await registerDevice();
  const response = await call('/api/v1/email/handle', { token });
  const { handle } = emailHandleResponseSchema.parse(await response.json());
  return { token, address: `r+${handle}@dev.at6pm.app`, hash: await hashDeviceToken(token) };
}

const reading = (over: Record<string, unknown>) => ({
  kind: 'payment',
  amount: null,
  currency: null,
  merchant: null,
  category: null,
  at: null,
  reference: null,
  note: null,
  ...over,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('receipt email read by the model', () => {
  it('keeps a foreign card charge with the merchant and category the model named', async () => {
    const { token, address, hash } = await phone();
    const model = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      anthropicAnswer(
        reading({
          amount: '99 USD',
          currency: 'USD',
          merchant: 'Apple',
          category: 'fun',
          at: '2026-10-16T10:25:31',
        }),
      ),
    );
    expect(await receiveEmail(inbound(address, cardAlert), withKey, NOW)).toBe('stored');

    const sent = sentBody(model.mock.calls[0]?.[1]) as { messages: { content: string }[] };
    expect(sent.messages[0]?.content).toContain('So tien: 99 USD');
    model.mockRestore();
    const response = await call('/api/v1/email/captures', { token });
    const { captures } = emailCapturesResponseSchema.parse(await response.json());
    expect(captures).toMatchObject([
      {
        amount: 9900,
        currency: 'USD',
        merchant: 'Apple',
        category: 'fun',
        at: '2026-10-16T03:25:31.000Z',
        bank: 'Vietcombank',
      },
    ]);
    const usage = await env.DB.prepare(
      "SELECT input_tokens, output_tokens FROM ai_usage WHERE route = 'email.read' AND device_hash = ?",
    )
      .bind(hash)
      .all();
    expect(usage.results).toEqual([{ input_tokens: 210, output_tokens: 14 }]);
  });

  it('drops what the model says is not a payment, and an amount the email does not print', async () => {
    const { address, hash } = await phone();
    const model = vi.spyOn(globalThis, 'fetch');
    model.mockResolvedValueOnce(anthropicAnswer(reading({ kind: 'promo' })));
    expect(await receiveEmail(inbound(address, cardAlert), withKey, NOW)).toBe('not_a_receipt');
    model.mockResolvedValueOnce(anthropicAnswer(reading({ amount: '990 USD', currency: 'USD' })));
    expect(await receiveEmail(inbound(address, cardAlert), withKey, NOW)).toBe('not_a_receipt');
    const rows = await env.DB.prepare('SELECT id FROM email_captures WHERE device_hash = ?')
      .bind(hash)
      .all();
    expect(rows.results).toEqual([]);
  });

  it('reads the email by its rules when the model does not answer', async () => {
    const { address } = await phone();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('busy', { status: 529 }));
    const mbAlert = [
      'From: MB Bank <thongbao@mbbank.com.vn>',
      'Subject: Thong bao bien dong so du',
      'Date: Fri, 16 Oct 2026 11:31:00 +0700',
      'Message-ID: <fallback-1@mbbank.com.vn>',
      'Content-Type: text/plain; charset=utf-8',
      '',
      'TK 0123xxx789 | GD: -45,000VND | 16/10/2026 11:30 | SD: 1,250,000VND',
      'ND: CHUYEN TIEN TOI PHO HOA',
      '',
    ].join('\r\n');
    expect(await receiveEmail(inbound(address, mbAlert), withKey, NOW)).toBe('stored');
  });

  it('never sends the model an email that prints no amount', async () => {
    const { address } = await phone();
    const model = vi.spyOn(globalThis, 'fetch');
    const alert = cardAlert.replace('So tien: 99 USD', 'Ma xac thuc: 258127');
    expect(await receiveEmail(inbound(address, alert), withKey, NOW)).toBe('not_a_receipt');
    expect(model).not.toHaveBeenCalled();
  });

  it('reads by the rules once the phone has used the day’s model reads', async () => {
    const { address, hash } = await phone();
    const insert = env.DB.prepare(
      `INSERT INTO ai_usage (route, model, input_tokens, output_tokens, device_hash, created_at)
       VALUES ('email.read', 'claude-haiku-5-5', 1, 1, ?, ?)`,
    );
    await env.DB.batch(
      Array.from({ length: EMAIL_MODEL_READS_PER_DAY }, () =>
        insert.bind(hash, new Date().toISOString()),
      ),
    );
    const model = vi.spyOn(globalThis, 'fetch');
    const mbAlert = [
      'From: MB Bank <thongbao@mbbank.com.vn>',
      'Subject: Thong bao bien dong so du',
      'Message-ID: <cap-1@mbbank.com.vn>',
      'Content-Type: text/plain; charset=utf-8',
      '',
      'TK 0123xxx789 | GD: -45,000VND | 16/10/2026 11:30 | SD: 1,250,000VND',
      '',
    ].join('\r\n');
    expect(await receiveEmail(inbound(address, mbAlert), withKey, NOW)).toBe('stored');
    expect(model).not.toHaveBeenCalled();
  });

  it('keeps reading with the model past the free allowance while the phone says it has Max', async () => {
    const { token, address, hash } = await phone();
    const insert = env.DB.prepare(
      `INSERT INTO ai_usage (route, model, input_tokens, output_tokens, device_hash, created_at)
       VALUES ('email.read', 'claude-haiku-5-5', 1, 1, ?, ?)`,
    );
    await env.DB.batch(
      Array.from({ length: EMAIL_MODEL_READS_PER_DAY }, () =>
        insert.bind(hash, new Date().toISOString()),
      ),
    );
    expect((await call('/api/v1/email/captures?plan=max', { token })).status).toBe(200);
    const model = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(anthropicAnswer(reading({ kind: 'promo' })));
    expect(await receiveEmail(inbound(address, cardAlert), withKey, new Date())).toBe(
      'not_a_receipt',
    );
    expect(model).toHaveBeenCalledTimes(1);

    model.mockRestore();
    expect((await call('/api/v1/email/captures?plan=free', { token })).status).toBe(200);
    const again = vi.spyOn(globalThis, 'fetch');
    await receiveEmail(inbound(address, cardAlert), withKey, new Date());
    expect(again).not.toHaveBeenCalled();
  });
});
