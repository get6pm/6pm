import { describe, expect, it } from '@jest/globals';

import { encodeVietQR, parseVietQR, type VietQR } from '@6pm/domain';

import { foreignAmountLabel, payeeName, payOptions, payWallets } from './pay-options';

function scan(payload: string): VietQR {
  const result = parseVietQR(payload);
  if (!result.ok) throw new Error(`expected a VietQR, got ${result.reason}`);
  return result;
}

const vcb = scan(
  encodeVietQR({
    bin: '970436',
    account: '0011004821',
    amount: 55_000,
    merchantName: 'BUN CHA CO LAN',
  }),
);

describe('payWallets', () => {
  it('offers the banks and wallets the user picked, leaving cash out', () => {
    expect(payWallets(['MB', 'CASH', 'MOMO']).map((b) => b.id)).toEqual(['MB', 'MOMO']);
  });

  it('falls back to the design’s three when the user picked none', () => {
    expect(payWallets([]).map((b) => b.id)).toEqual(['MB', 'VCB', 'MOMO']);
    expect(payWallets(['CASH']).map((b) => b.id)).toEqual(['MB', 'VCB', 'MOMO']);
  });
});

describe('payOptions', () => {
  it('lets a transfer to an account be paid from any of the user’s wallets', () => {
    expect(payOptions(vcb, ['TCB', 'MOMO'])).toEqual({
      mode: 'wallets',
      wallets: payWallets(['TCB', 'MOMO']),
    });
  });

  it('sends a merchant QR to the first bank 6pm can open, since only a bank app can pay it', () => {
    const merchant: VietQR = { ...vcb, service: 'merchant' };
    const options = payOptions(merchant, ['MOMO', 'TCB']);
    expect(options.mode).toBe('bankApp');
    expect(options.mode === 'bankApp' && options.bank?.id).toBe('TCB');
  });

  it('still offers a merchant QR when none of the user’s wallets can be opened', () => {
    const merchant: VietQR = { ...vcb, service: 'merchant' };
    expect(payOptions(merchant, ['MOMO'])).toEqual({ mode: 'bankApp', bank: null });
  });
});

describe('payeeName', () => {
  it('turns a name in capitals into a name', () => {
    expect(payeeName(vcb)).toBe('Bun Cha Co Lan');
    expect(payeeName({ ...vcb, merchantName: 'NGUYỄN VĂN AN' })).toBe('Nguyễn Văn An');
  });

  it('keeps a name the merchant already cased', () => {
    expect(payeeName({ ...vcb, merchantName: 'Bún chả Cô Lan' })).toBe('Bún chả Cô Lan');
  });

  it('names the bank and account tail when the QR has no name', () => {
    expect(payeeName({ ...vcb, merchantName: null })).toBe('Vietcombank •••• 4821');
  });
});

describe('foreignAmountLabel', () => {
  it('writes a Thai PromptPay amount in baht', () => {
    const failure = parseVietQR(
      '00020101021229370016A0000006770101110113006681234567853037645406120.005802TH6304BC9B',
    );
    expect(failure.ok).toBe(false);
    if (!failure.ok) expect(foreignAmountLabel(failure)).toBe('฿120');
  });

  it('is null for a foreign QR without an amount', () => {
    expect(foreignAmountLabel({ ok: false, reason: 'foreign', currency: '764' })).toBeNull();
  });
});
