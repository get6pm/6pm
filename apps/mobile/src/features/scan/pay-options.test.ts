import { describe, expect, it } from '@jest/globals';

import { currencyOf, encodeVietQR, parseVietQR, VND, type VietQR } from '@6pm/domain';

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

  it('offers no bank the user did not pick, and none they named by hand', () => {
    expect(payWallets([])).toEqual([]);
    expect(payWallets(['CASH', 'name:MB'])).toEqual([]);
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
    const options = payOptions(merchant, ['VTLMONEY', 'TCB']);
    expect(options.mode).toBe('bankApp');
    expect(options.mode === 'bankApp' && options.bank?.id).toBe('TCB');
  });

  it('sends a transfer to a bank app when the user picked no bank 6pm knows', () => {
    expect(payOptions(vcb, [])).toEqual({ mode: 'bankApp', bank: null });
    expect(payOptions(vcb, ['CASH', 'name:Chase'])).toEqual({ mode: 'bankApp', bank: null });
  });

  it('still offers a merchant QR when none of the user’s wallets can be opened', () => {
    const merchant: VietQR = { ...vcb, service: 'merchant' };
    expect(payOptions(merchant, ['VTLMONEY'])).toEqual({ mode: 'bankApp', bank: null });
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
  const dong = { home: VND, language: 'en' } as const;

  it('writes a Thai PromptPay amount in baht', () => {
    const failure = parseVietQR(
      '00020101021229370016A0000006770101110113006681234567853037645406120.005802TH6304BC9B',
    );
    expect(failure.ok).toBe(false);
    if (!failure.ok) expect(foreignAmountLabel(failure, dong)).toBe('฿120');
  });

  it('writes it in the phone’s own style away from đồng', () => {
    const failure = { ok: false, reason: 'foreign', currency: '702', amount: '12.5' } as const;
    const us = {
      home: currencyOf('USD'),
      language: 'en',
      phone: { languageTag: 'en-US' },
    } as const;
    expect(foreignAmountLabel(failure, dong)).toBe('S$12,50');
    expect(foreignAmountLabel(failure, us)).toBe('S$12.50');
  });

  it('is null for a foreign QR without an amount', () => {
    expect(foreignAmountLabel({ ok: false, reason: 'foreign', currency: '764' }, dong)).toBeNull();
  });
});
