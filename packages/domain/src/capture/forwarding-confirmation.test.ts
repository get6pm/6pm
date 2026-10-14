import { describe, expect, it } from 'vitest';

import { forwardingCheckSchema, isForwardingConfirmUrl } from '../contracts/receipt-email';
import { parseForwardingConfirmation } from './forwarding-confirmation';
import type { ReceiptEmail } from './receipt-email';

// Gmail's confirmation as it sends it (plain text, the account's language); addresses, codes and
// link tokens are made up.

const receivedAt = '2026-10-14T03:00:00.000Z';
const GOOGLE = { name: 'Gmail Team', address: 'forwarding-noreply@google.com' };
const TO = 'receipts+3jdz66nqg6@6pm.oddeggs.studio';
const CONFIRM =
  'https://mail-settings.google.com/mail/vf-%5BANGjdJ9hkvVgkNjxohK3G_smiGacACYcwk1mNYesZgMNvYW4BzAjq2d%5D-Zra73ESu8vcr1vUZT9u1ya-8wUA';
const CANCEL =
  'https://mail-settings.google.com/mail/uf-%5BANGjdJ-5d9aZBg-1gmgZZhr6kOPH_6fP491j8UNFfGKqAlg%5D-Zra73ESu8vcr1vUZT9u1ya-8wUA';

const email = (over: Partial<ReceiptEmail>): ReceiptEmail => ({
  from: GOOGLE,
  subject: '',
  date: '2026-10-14T02:59:40.000Z',
  text: null,
  html: null,
  ...over,
});

const english = email({
  subject: '(#99427480) Gmail Forwarding Confirmation - Receive Mail from lan.example@gmail.com',
  text: [
    `lan.example@gmail.com has requested to automatically forward mail to your email`,
    `address ${TO}.`,
    'Confirmation code: 99427480',
    '',
    'To allow lan.example@gmail.com to automatically forward mail to your address,',
    'please click the link below to confirm the request:',
    '',
    CONFIRM,
    '',
    'If you click the link and it appears to be broken, please copy and paste it',
    "into a new browser window. If you aren't able to access the link, you",
    'can send the confirmation code',
    '99427480 to lan.example@gmail.com.',
    '',
    'Thanks for using Gmail!',
    '',
    'If you do not approve of this request, no further action is required.',
    'If you accidentally clicked the link, but you do not want to allow',
    'lan.example@gmail.com to automatically forward messages to your address,',
    'click this link to cancel this verification:',
    CANCEL,
    '',
    'To learn more about why you might have received this message, please',
    'visit: http://support.google.com/mail/bin/answer.py?answer=184973.',
  ].join('\n'),
});

const vietnamese = email({
  subject: '(#38721011) Gmail Xác nhận chuyển tiếp - Nhận thư từ minh.example@gmail.com',
  text: [
    `minh.example@gmail.com đã yêu cầu tự động chuyển tiếp thư đến địa chỉ email của bạn ${TO}.`,
    'Mã xác nhận: 38721011',
    '',
    'Để cho phép minh.example@gmail.com tự động chuyển tiếp thư đến địa chỉ của bạn, vui lòng nhấp',
    'vào liên kết bên dưới để xác nhận yêu cầu:',
    '',
    CONFIRM.replace('8wUA', '9xVB'),
    '',
    'Nếu bạn vô tình nhấp vào liên kết, hãy nhấp vào liên kết này để hủy xác minh:',
    CANCEL,
  ].join('\n'),
});

describe('reading a forwarding confirmation', () => {
  it('reads Gmail’s English confirmation: code, confirm link, the asking account', () => {
    expect(parseForwardingConfirmation(english, { receivedAt })).toEqual({
      provider: 'gmail',
      code: '99427480',
      confirmUrl: CONFIRM,
      address: 'lan.example@gmail.com',
      receivedAt,
    });
  });

  it('reads it in Vietnamese the same way, without depending on its words', () => {
    const read = parseForwardingConfirmation(vietnamese, { receivedAt });
    expect(read?.code).toBe('38721011');
    expect(read?.address).toBe('minh.example@gmail.com');
    expect(read?.confirmUrl).toBe(CONFIRM.replace('8wUA', '9xVB'));
  });

  it('reads the older subject order and a code only in the body', () => {
    const older = email({
      subject: 'Xác nhận Chuyển tiếp Gmail - Nhận Thư từ an.example@gmail.com',
      text: 'Mã xác nhận: 6508315\n' + CONFIRM,
    });
    const read = parseForwardingConfirmation(older, { receivedAt });
    expect(read?.code).toBe('6508315');
    expect(read?.address).toBe('an.example@gmail.com');
  });

  it('takes the link from an HTML body, never the cancel link', () => {
    const html = email({
      subject: '(#11223344) Gmail Forwarding Confirmation - Receive Mail from x.example@gmail.com',
      html: `<p>Confirmation code: 11223344</p><p><a href="${CANCEL}">cancel</a></p>
        <p><a href="${CONFIRM.replace('%5B', '[').replace('%5D', ']')}">confirm</a></p>`,
    });
    expect(parseForwardingConfirmation(html, { receivedAt })?.confirmUrl).toBe(CONFIRM);
  });

  it('keeps the code when the only links are not Google’s own confirm link', () => {
    const lookalikes = [
      CONFIRM.replace('mail-settings.google.com', 'mail-settings.google.com.example.net'),
      CONFIRM.replace(
        'https://mail-settings.google.com',
        'https://evil.example/mail-settings.google.com',
      ),
      CONFIRM.replace('https://', 'https://user@'),
      CONFIRM.replace('.google.com/', '.google.com:8443/'),
      `${CONFIRM}?next=https://evil.example`,
      CANCEL,
    ];
    const read = parseForwardingConfirmation(
      email({
        subject: english.subject,
        text: `Confirmation code: 99427480\n${lookalikes.join('\n')}`,
      }),
      { receivedAt },
    );
    expect(read?.code).toBe('99427480');
    expect(read?.confirmUrl).toBeNull();
  });

  it('ignores the same words from anyone but Google’s forwarding sender', () => {
    for (const from of [
      { name: 'Lan', address: 'lan.example@gmail.com' },
      { name: 'Gmail Team', address: 'forwarding-noreply@google.com.example.net' },
      null,
    ]) {
      expect(parseForwardingConfirmation({ ...english, from }, { receivedAt })).toBeNull();
    }
  });

  it('is not a confirmation without a code', () => {
    const plain = email({ subject: 'Your Gmail settings', text: 'Something changed.' });
    expect(parseForwardingConfirmation(plain, { receivedAt })).toBeNull();
  });
});

describe('the confirm link check', () => {
  it('takes Gmail’s confirm hosts and path only', () => {
    expect(isForwardingConfirmUrl('gmail', CONFIRM)).toBe(true);
    expect(isForwardingConfirmUrl('gmail', CONFIRM.replace('mail-settings', 'mail'))).toBe(true);
    expect(isForwardingConfirmUrl('gmail', CONFIRM.replace('https', 'http'))).toBe(false);
    expect(isForwardingConfirmUrl('gmail', CANCEL)).toBe(false);
    expect(isForwardingConfirmUrl('gmail', `${CONFIRM}#x`)).toBe(false);
    expect(isForwardingConfirmUrl('gmail', 'https://google.com/mail/vf-abcdefghij')).toBe(false);
  });

  it('is enforced by the wire schema the phone reads', () => {
    const check = {
      id: 'abcdefghijklmnop',
      provider: 'gmail',
      code: '99427480',
      confirmUrl: CONFIRM,
      address: 'lan.example@gmail.com',
      receivedAt,
    };
    expect(forwardingCheckSchema.safeParse(check).success).toBe(true);
    const bad = { ...check, confirmUrl: 'https://evil.example/vf-abcdefghij' };
    expect(forwardingCheckSchema.safeParse(bad).success).toBe(false);
  });
});
