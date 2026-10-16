import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import {
  ackEmailCapturesResponseSchema,
  emailCapturesResponseSchema,
  emailHandleResponseSchema,
} from '@6pm/domain';

import { hashDeviceToken } from '../src/device-auth';
import { EMAIL_MAX_BYTES, receiveEmail, type InboundEmail } from '../src/receipt-email/receive';
import { openCapture } from '../src/receipt-email/seal';

import { call, registerDevice } from './support';

const HOST = '6pm-dev.oddeggs.studio';
const NOW = new Date('2026-10-10T10:00:00.000Z');

/** A synthetic MB Bank balance notification, as Email Routing would hand it over. */
function rawEmail(messageId: string, amount = '45,000'): string {
  return [
    'From: MB Bank <thongbao@mbbank.com.vn>',
    'To: someone@example.com',
    'Subject: Thong bao bien dong so du',
    'Date: Sat, 10 Oct 2026 12:31:00 +0700',
    `Message-ID: <${messageId}@mbbank.com.vn>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    `TK 0123xxx789 | GD: -${amount}VND | 10/10/2026 12:30 | SD: 1,250,000VND`,
    'ND: CHUYEN TIEN TOI PHO HOA',
    '',
  ].join('\r\n');
}

function inbound(to: string, raw: string, rawSize = raw.length) {
  const rejected: string[] = [];
  const message: InboundEmail = {
    to,
    rawSize,
    raw: new Response(raw).body as ReadableStream<Uint8Array>,
    setReject: (reason) => rejected.push(reason),
  };
  return { message, rejected };
}

async function phone() {
  const token = await registerDevice();
  const response = await call('/api/v1/email/handle', { token });
  expect(response.status).toBe(200);
  const { handle } = emailHandleResponseSchema.parse(await response.json());
  return {
    token,
    handle,
    address: `receipts+${handle}@${HOST}`,
    hash: await hashDeviceToken(token),
  };
}

const fetchCaptures = async (token: string) => {
  const response = await call('/api/v1/email/captures', { token });
  expect(response.status).toBe(200);
  return emailCapturesResponseSchema.parse(await response.json()).captures;
};

const ack = async (token: string, ids: string[]) => {
  const response = await call('/api/v1/email/captures/ack', {
    method: 'POST',
    token,
    body: { ids },
  });
  expect(response.status).toBe(200);
  return ackEmailCapturesResponseSchema.parse(await response.json()).removed;
};

describe('the receipt email handle', () => {
  it('gives a phone one stable handle and a new one when it asks', async () => {
    const { token, handle } = await phone();
    const again = emailHandleResponseSchema.parse(
      await (await call('/api/v1/email/handle', { token })).json(),
    );
    expect(again.handle).toBe(handle);
    const rotated = emailHandleResponseSchema.parse(
      await (await call('/api/v1/email/handle', { method: 'POST', token })).json(),
    );
    expect(rotated.handle).not.toBe(handle);
    const after = emailHandleResponseSchema.parse(
      await (await call('/api/v1/email/handle', { token })).json(),
    );
    expect(after.handle).toBe(rotated.handle);
  });

  it('needs a registered device', async () => {
    expect((await call('/api/v1/email/handle')).status).toBe(401);
    expect((await call('/api/v1/email/captures')).status).toBe(401);
  });
});

describe('receiving a receipt email', () => {
  it('refuses mail to an address no phone holds, and to one that cannot be a handle', async () => {
    for (const to of [`k7m2q9xd4p@${HOST}`, `postmaster@${HOST}`]) {
      const { message, rejected } = inbound(to, rawEmail('a1'));
      expect(await receiveEmail(message, env, NOW)).toBe('unknown_address');
      expect(rejected).toHaveLength(1);
    }
  });

  it('refuses mail to an old handle after a new one is made', async () => {
    const { token, address } = await phone();
    await call('/api/v1/email/handle', { method: 'POST', token });
    const { message } = inbound(address, rawEmail('old1'));
    expect(await receiveEmail(message, env, NOW)).toBe('unknown_address');
  });

  it('refuses mail larger than a receipt', async () => {
    const { address } = await phone();
    const { message, rejected } = inbound(address, rawEmail('big1'), EMAIL_MAX_BYTES + 1);
    expect(await receiveEmail(message, env, NOW)).toBe('too_large');
    expect(rejected).toHaveLength(1);
  });

  it('stores only what it read, sealed, and hands it to its phone', async () => {
    const { token, address, hash } = await phone();
    const { message, rejected } = inbound(address.toUpperCase(), rawEmail('vcb-1'));
    expect(await receiveEmail(message, env, NOW)).toBe('stored');
    expect(rejected).toEqual([]);

    const rows = (
      await env.DB.prepare('SELECT * FROM email_captures WHERE device_hash = ?').bind(hash).all()
    ).results;
    expect(rows).toHaveLength(1);
    const stored = JSON.stringify(rows);
    for (const plain of ['PHO HOA', 'CHUYEN TIEN', 'mbbank', '45000', '45,000', 'Thong bao']) {
      expect(stored).not.toContain(plain);
    }
    const row = rows[0] as { id: string; sealed: string };
    expect(
      await openCapture('another-key-0123456789abcdef0123456789', hash, row.id, row.sealed),
    ).toBeNull();

    const captures = await fetchCaptures(token);
    expect(captures).toEqual([
      {
        id: row.id,
        amount: 45_000,
        merchant: 'PHO HOA',
        at: '2026-10-10T05:30:00.000Z',
        from: 'thongbao@mbbank.com.vn',
        bank: 'MB Bank',
        code: null,
        memo: 'CHUYEN TIEN TOI PHO HOA',
        currency: 'VND',
        category: null,
      },
    ]);
  });

  it('takes no mail while the seal key is not set, rather than keep it unsealed', async () => {
    const { address } = await phone();
    const { message, rejected } = inbound(address, rawEmail('nokey-1'));
    const unset = { ...env, EMAIL_SEAL_KEY: undefined } as unknown as typeof env;
    expect(await receiveEmail(message, unset, NOW)).toBe('not_configured');
    expect(rejected).toHaveLength(1);
  });

  it('keeps one receipt for the same email sent twice', async () => {
    const { token, address } = await phone();
    for (let n = 0; n < 2; n += 1) {
      const { message } = inbound(address, rawEmail('twice-1'));
      expect(await receiveEmail(message, env, NOW)).toBe('stored');
    }
    expect(await fetchCaptures(token)).toHaveLength(1);
  });

  it('keeps one receipt for one bank alert forwarded twice, each with its own Message-ID', async () => {
    const { token, address } = await phone();
    const withCode = (id: string, amount?: string) =>
      rawEmail(id, amount).replace('ND: ', 'Ma GD: FT26283123456\r\nND: ');
    for (const id of ['filter-1', 'by-hand-1']) {
      const { message } = inbound(address, withCode(id));
      expect(await receiveEmail(message, env, NOW)).toBe('stored');
    }
    expect(await fetchCaptures(token)).toHaveLength(1);
    // The same code on another amount is another payment.
    await receiveEmail(inbound(address, withCode('other-1', '30,000')).message, env, NOW);
    expect(await fetchCaptures(token)).toHaveLength(2);
  });

  it('drops mail that holds no payment, without a bounce', async () => {
    const { token, address } = await phone();
    const raw = rawEmail('news-1').replace(/TK 0123[^\r]*\r\n/, 'Giam gia cho ban!\r\n');
    const { message, rejected } = inbound(address, raw);
    expect(await receiveEmail(message, env, NOW)).toBe('not_a_receipt');
    expect(rejected).toEqual([]);
    expect(await fetchCaptures(token)).toEqual([]);
  });

  it('keeps one phone’s receipts from another', async () => {
    const mine = await phone();
    const other = await phone();
    const { message } = inbound(mine.address, rawEmail('mine-1'));
    await receiveEmail(message, env, NOW);
    expect(await fetchCaptures(other.token)).toEqual([]);
    const [capture] = await fetchCaptures(mine.token);
    expect(await ack(other.token, [capture?.id ?? ''])).toBe(0);
    expect(await fetchCaptures(mine.token)).toHaveLength(1);
  });
});

describe('acknowledging', () => {
  it('deletes what the phone saved, and a second acknowledgement changes nothing', async () => {
    const { token, address } = await phone();
    for (const [n, amount] of ['45,000', '60,000'].entries()) {
      const { message } = inbound(address, rawEmail(`ack-${n}`, amount));
      await receiveEmail(message, env, new Date(NOW.getTime() + n * 1000));
    }
    const captures = await fetchCaptures(token);
    expect(captures.map((c) => c.amount)).toEqual([45_000, 60_000]);
    const first = captures[0]?.id ?? '';
    expect(await ack(token, [first])).toBe(1);
    expect(await ack(token, [first])).toBe(0);
    expect((await fetchCaptures(token)).map((c) => c.amount)).toEqual([60_000]);
  });

  it('turns away a malformed acknowledgement', async () => {
    const { token } = await phone();
    const response = await call('/api/v1/email/captures/ack', {
      method: 'POST',
      token,
      body: { ids: ['bad id'] },
    });
    expect(response.status).toBe(400);
  });
});

describe('rate limiting', () => {
  it('refuses mail to one address past its allowance', async () => {
    const { address } = await phone();
    const outcomes: string[] = [];
    for (let n = 0; n < 22; n += 1) {
      const { message } = inbound(address, rawEmail(`burst-${n}`));
      outcomes.push(await receiveEmail(message, env, NOW));
    }
    expect(outcomes.slice(0, 20).every((o) => o === 'stored')).toBe(true);
    expect(outcomes.at(-1)).toBe('rate_limited');
  });
});
