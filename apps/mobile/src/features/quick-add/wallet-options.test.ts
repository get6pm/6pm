import { describe, expect, it } from '@jest/globals';

import { walletOptions } from './wallet-options';

describe('walletOptions', () => {
  it('puts cash first, translated, then the banks chosen in onboarding', () => {
    const options = walletOptions(['VCB', 'CASH', 'MOMO'], 'Tiền mặt');
    expect(options.map((o) => o.label)).toEqual(['Tiền mặt', 'Vietcombank', 'MoMo']);
    expect(options[0]?.value).toBe('Cash');
    expect(options[2]?.icon).toBe('account_balance_wallet');
  });

  it('offers the design banks when none were chosen', () => {
    expect(walletOptions([], 'Cash').map((o) => o.label)).toEqual(['Cash', 'MB Bank', 'MoMo']);
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
