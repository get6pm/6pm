import { describe, expect, it } from '@jest/globals';

import { walletOptions } from './wallet-options';

describe('walletOptions', () => {
  it('puts cash first, translated, then the banks chosen in onboarding', () => {
    const options = walletOptions(['VCB', 'CASH', 'MOMO'], 'Tiền mặt');
    expect(options.map((o) => o.label)).toEqual(['Tiền mặt', 'Vietcombank', 'MoMo']);
    expect(options[0]?.value).toBe('Cash');
    expect(options[2]?.icon).toBe('account_balance_wallet');
  });

  it('offers only cash when none were chosen', () => {
    expect(walletOptions([], 'Cash').map((o) => o.label)).toEqual(['Cash']);
    expect(walletOptions(['CASH'], 'Cash').map((o) => o.label)).toEqual(['Cash']);
  });

  it('offers a bank chosen by its typed name, stored by that name', () => {
    const options = walletOptions(['name:Chase', 'MB'], 'Cash');
    expect(options.map((o) => o.value)).toEqual(['Cash', 'Chase', 'MB Bank']);
    expect(options[1]?.bankId).toBe('name:Chase');
  });

  it('never offers a typed name that reads as a catalogue code as that bank', () => {
    expect(walletOptions(['name:MB'], 'Cash').map((o) => [o.value, o.bankId])).toEqual([
      ['Cash', undefined],
      ['MB', 'name:MB'],
    ]);
  });

  it('keeps a wallet the spend already has, even if it is no longer chosen', () => {
    const options = walletOptions(['MB'], 'Cash', 'Techcombank');
    expect(options.map((o) => o.value)).toEqual(['Cash', 'MB Bank', 'Techcombank']);
  });

  it('does not repeat a wallet the spend has that is already offered', () => {
    expect(walletOptions(['MB'], 'Cash', 'MB Bank')).toHaveLength(2);
  });

  it('skips a code the bank list does not know', () => {
    expect(walletOptions(['NOPE'], 'Cash')).toHaveLength(1);
  });
});
