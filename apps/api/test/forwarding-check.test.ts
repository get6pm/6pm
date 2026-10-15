import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import {
  dismissForwardingCheckResponseSchema,
  emailCapturesResponseSchema,
  emailHandleResponseSchema,
  FORWARDING_CHECK_TTL_MS,
  forwardingCheckResponseSchema,
} from '@6pm/domain';

import { receiveEmail, type InboundEmail } from '../src/receipt-email/receive';

import { call, registerDevice } from './support';

const HOST = '6pm-dev.oddeggs.studio';
const CONFIRM =
  'https://mail-settings.google.com/mail/vf-%5BANGjdJ9hkvVgkNjxohK3G_smiGacACYcwk%5D-Zra73ESu8vcr1vUZT9u1ya';
const CANCEL =
  'https://mail-settings.google.com/mail/uf-%5BANGjdJ-5d9aZBg-1gmgZZhr6kOPH_6fP491j8%5D-Zra73ESu8vcr1vUZT9u1ya';

/** Gmail's forwarding confirmation as Email Routing hands it over; the account is made up. */
function confirmation(to: string, code = '99427480', from = 'forwarding-noreply@google.com') {
  return [
    `From: Gmail Team <${from}>`,
    `To: ${to}`,
    `Subject: (#${code}) Gmail Forwarding Confirmation - Receive Mail from lan.example@gmail.com`,
    'Date: Wed, 14 Oct 2026 10:00:00 +0700',
    `Message-ID: <fwd-${code}@google.com>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    '',
    'lan.example@gmail.com has requested to automatically forward mail to your email',
    `address ${to}.`,
    `Confirmation code: ${code}`,
    '',
    'please click the link below to confirm the request:',
    CONFIRM,
    '',
    'click this link to cancel this verification:',
    CANCEL,
    '',
  ].join('\r\n');
}

function inbound(to: string, raw: string) {
  const rejected: string[] = [];
  const message: InboundEmail = {
    to,
    rawSize: raw.length,
    raw: new Response(raw).body as ReadableStream<Uint8Array>,
    setReject: (reason) => rejected.push(reason),
  };
  return { message, rejected };
}

async function phone() {
  const token = await registerDevice();
  const response = await call('/api/v1/email/handle', { token });
  const { handle } = emailHandleResponseSchema.parse(await response.json());
  return { token, address: `receipts+${handle}@${HOST}` };
}

const fetchCheck = async (token: string) => {
  const response = await call('/api/v1/email/forwarding-check', { token });
  expect(response.status).toBe(200);
  return forwardingCheckResponseSchema.parse(await response.json()).check;
};

const dismiss = async (token: string, id: string) => {
  const response = await call('/api/v1/email/forwarding-check/dismiss', {
    method: 'POST',
    token,
    body: { id },
  });
  expect(response.status).toBe(200);
  return dismissForwardingCheckResponseSchema.parse(await response.json()).removed;
};

describe('a forwarding confirmation', () => {
  it('is kept, sealed, for its phone instead of being dropped', async () => {
    const { token, address } = await phone();
    const now = new Date();
    const { message, rejected } = inbound(address, confirmation(address));
    expect(await receiveEmail(message, env, now)).toBe('forwarding_check');
    expect(rejected).toEqual([]);

    const stored = JSON.stringify(
      (await env.DB.prepare('SELECT * FROM email_forwarding_checks').all()).results,
    );
    for (const plain of ['99427480', 'lan.example', 'mail-settings', 'Gmail']) {
      expect(stored).not.toContain(plain);
    }

    const check = await fetchCheck(token);
    expect(check).toEqual({
      id: check?.id,
      provider: 'gmail',
      code: '99427480',
      confirmUrl: CONFIRM,
      address: 'lan.example@gmail.com',
      receivedAt: now.toISOString(),
    });
    const captures = await call('/api/v1/email/captures', { token });
    expect(emailCapturesResponseSchema.parse(await captures.json()).captures).toEqual([]);
  });

  it('keeps one per phone: a re-sent confirmation replaces the older', async () => {
    const { token, address } = await phone();
    for (const code of ['11111111', '22222222']) {
      const { message } = inbound(address, confirmation(address, code));
      expect(await receiveEmail(message, env, new Date())).toBe('forwarding_check');
    }
    expect((await fetchCheck(token))?.code).toBe('22222222');
  });

  it('is gone once dismissed, and dismissing an older one leaves a newer', async () => {
    const { token, address } = await phone();
    await receiveEmail(inbound(address, confirmation(address, '11111111')).message, env);
    const first = await fetchCheck(token);
    await receiveEmail(inbound(address, confirmation(address, '22222222')).message, env);
    expect(await dismiss(token, first?.id ?? '')).toBe(0);
    const second = await fetchCheck(token);
    expect(second?.code).toBe('22222222');
    expect(await dismiss(token, second?.id ?? '')).toBe(1);
    expect(await fetchCheck(token)).toBeNull();
  });

  it('is not shown after a week', async () => {
    const { token, address } = await phone();
    const old = new Date(Date.now() - FORWARDING_CHECK_TTL_MS - 60_000);
    await receiveEmail(inbound(address, confirmation(address)).message, env, old);
    expect(await fetchCheck(token)).toBeNull();
  });

  it('is never shown to another phone', async () => {
    const mine = await phone();
    const other = await phone();
    await receiveEmail(inbound(mine.address, confirmation(mine.address)).message, env);
    expect(await fetchCheck(other.token)).toBeNull();
    const id = (await fetchCheck(mine.token))?.id ?? '';
    expect(await dismiss(other.token, id)).toBe(0);
    expect(await fetchCheck(mine.token)).not.toBeNull();
  });

  it('is only Google’s own: the same email from anyone else is not a check', async () => {
    const { token, address } = await phone();
    const raw = confirmation(address, '99427480', 'lan.example@gmail.com');
    expect(await receiveEmail(inbound(address, raw).message, env)).toBe('not_a_receipt');
    expect(await fetchCheck(token)).toBeNull();
  });

  it('needs a registered device', async () => {
    expect((await call('/api/v1/email/forwarding-check')).status).toBe(401);
  });
});
