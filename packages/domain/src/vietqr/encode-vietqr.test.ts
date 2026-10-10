import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { crc16CcittFalse } from './crc16';
import { encodeVietQR, type VietQRInput } from './encode-vietqr';
import { parseVietQR } from './parse-vietqr';

const VIETNAMESE = Array.from(
  'aàáảãạăằắẳẵặâầấẩẫậbcdđeèéẻẽẹêềếểễệghiìíỉĩịklmnoòóỏõọôồốổỗộơờớởỡợpqrstuùúủũụưừứửữựvxyỳýỷỹỵĐƯƠ 0123456789',
);
const textArb = fc
  .array(fc.oneof(fc.constantFrom(...VIETNAMESE), fc.constantFrom('☕', '🍜', '-', '.')), {
    minLength: 1,
    maxLength: 40,
  })
  .map((chars) => chars.join(''));

const inputArb = fc
  .record({
    bin: fc.stringMatching(/^\d{6}$/),
    account: fc.stringMatching(/^[0-9A-Za-z]{1,19}$/),
    amount: fc.option(fc.integer({ min: 1, max: 9_999_999_999_999 }), { nil: undefined }),
    note: fc.option(textArb, { nil: undefined }),
    merchantName: fc.option(textArb, { nil: undefined }),
  })
  .map(({ bin, account, amount, note, merchantName }) => {
    const input: VietQRInput = { bin, account };
    if (amount !== undefined) input.amount = amount;
    if (note !== undefined) input.note = note;
    if (merchantName !== undefined) input.merchantName = merchantName;
    return input;
  });

const orNull = (value: string | undefined) => value?.trim() || null;

describe('encodeVietQR', () => {
  it('builds the same payload as the published static sample', () => {
    expect(encodeVietQR({ bin: '970407', account: '9602091996' })).toBe(
      '00020101021138540010A00000072701240006970407011096020919960208QRIBFTTA53037045802VN630434A0',
    );
  });

  it('builds a one-off QR with an amount and a Vietnamese note', () => {
    expect(
      encodeVietQR({
        bin: '970436',
        account: '1023334821',
        amount: 55_000,
        note: '2 suất bún chả',
      }),
    ).toBe(
      '00020101021238540010A00000072701240006970436011010233348210208QRIBFTTA53037045405550005802VN621808142 suất bún chả63046507',
    );
  });

  it('marks card transfers with the card service code', () => {
    const qr = parseVietQR(
      encodeVietQR({ bin: '970418', account: '9704180012345678', service: 'card' }),
    );
    expect(qr).toMatchObject({ ok: true, service: 'card' });
  });

  it('reads back every field it writes, with a valid checksum', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const payload = encodeVietQR(input);
        expect(crc16CcittFalse(payload.slice(0, -4))).toBe(payload.slice(-4));
        expect(parseVietQR(payload)).toMatchObject({
          ok: true,
          kind: 'vietqr',
          bin: input.bin,
          account: input.account,
          service: 'account',
          amount: input.amount ?? null,
          note: orNull(input.note),
          merchantName: orNull(input.merchantName),
          dynamic: input.amount !== undefined,
        });
      }),
    );
  });

  it('refuses inputs NAPAS would refuse', () => {
    const ok = { bin: '970436', account: '1023334821' };
    expect(() => encodeVietQR({ ...ok, bin: '97043' })).toThrow(RangeError);
    expect(() => encodeVietQR({ ...ok, account: '1023 3348' })).toThrow(RangeError);
    expect(() => encodeVietQR({ ...ok, account: '1'.repeat(20) })).toThrow(RangeError);
    expect(() => encodeVietQR({ ...ok, amount: 0 })).toThrow(RangeError);
    expect(() => encodeVietQR({ ...ok, amount: 55_000.5 })).toThrow(RangeError);
    expect(() => encodeVietQR({ ...ok, note: 'x'.repeat(100) })).toThrow(RangeError);
  });
});
