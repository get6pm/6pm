import { describe, expect, it } from 'vitest';

import { BANKS, appStoreUrl, findBank, findBankByBin } from './bank-catalogue';

describe('bank catalogue', () => {
  it.each([
    ['970422', 'MB Bank'],
    ['970436', 'Vietcombank'],
    ['970407', 'Techcombank'],
    ['970432', 'VPBank'],
    ['970416', 'ACB'],
    ['970418', 'BIDV'],
    ['970415', 'VietinBank'],
    ['970405', 'Agribank'],
    ['970403', 'Sacombank'],
    ['970423', 'TPBank'],
    ['970441', 'VIB'],
    ['970437', 'HDBank'],
    ['970426', 'MSB'],
    ['970443', 'SHB'],
    ['970448', 'OCB'],
    ['970440', 'SeABank'],
    ['546034', 'Cake'],
    ['963388', 'Timo'],
  ])('knows BIN %s as %s', (bin, shortName) => {
    const bank = findBankByBin(bin);
    expect(bank).toMatchObject({ shortName, kind: 'bank' });
    expect(bank?.color).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('lists MoMo, ZaloPay and ViettelMoney as wallets', () => {
    expect(findBank('momo')).toMatchObject({ shortName: 'MoMo', kind: 'wallet', bin: '971025' });
    expect(findBank('ZALOPAY')).toMatchObject({ shortName: 'ZaloPay', kind: 'wallet', bin: null });
    expect(findBankByBin('971005')).toMatchObject({ shortName: 'ViettelMoney', kind: 'wallet' });
  });

  it('has unique ids and BINs, and six-digit BINs', () => {
    const bins = BANKS.flatMap((b) => (b.bin ? [b.bin] : []));
    expect(new Set(bins).size).toBe(bins.length);
    expect(new Set(BANKS.map((b) => b.id)).size).toBe(BANKS.length);
    for (const bin of bins) expect(bin).toMatch(/^\d{6}$/);
  });

  it('returns null for a BIN it does not know', () => {
    expect(findBankByBin('970999')).toBeNull();
  });

  it('gives an iOS hand-off for the big retail banks, and an App Store fallback', () => {
    const mb = findBank('MB');
    expect(mb?.ios?.scheme).toBe('mbbank://');
    expect(mb?.ios && appStoreUrl(mb.ios)).toBe('https://apps.apple.com/vn/app/id1205807363');
    for (const id of ['VCB', 'TCB', 'VPB', 'ACB', 'BIDV', 'ICB', 'VBA', 'TPB', 'CAKE', 'TIMO']) {
      expect(findBank(id)?.ios?.scheme).toMatch(/^[a-z][a-z0-9.+-]*:\/\/$/);
    }
  });
});
