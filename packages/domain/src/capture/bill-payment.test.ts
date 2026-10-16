import { describe, expect, it } from 'vitest';

import { payCycleOn } from '../plan/pay-cycle';
import {
  billChoicesFor,
  billPaymentAsks,
  namesRepayment,
  REPAYMENT,
  type PayableBill,
  type PaymentCapture,
} from './bill-payment';

// 25 Sep → 25 Oct: every bill below falls due in October.
const cycle = payCycleOn('2026-10-10', { kind: 'sameDay', day: 25 });

const bill = (over: Partial<PayableBill> & Pick<PayableBill, 'id'>): PayableBill => ({
  name: over.id,
  amount: 5_000_000,
  dueDay: 10,
  paidCycle: null,
  ...over,
});

const spend = (
  over: Partial<PaymentCapture> & Pick<PaymentCapture, 'id' | 'amount'>,
): PaymentCapture => ({
  day: '2026-10-10',
  merchant: 'CHUYEN TIEN',
  note: null,
  ...over,
});

describe('namesRepayment', () => {
  it('reads repayment words with or without accents, in either language', () => {
    expect(namesRepayment('Thanh toán thẻ tín dụng VPBank')).toBe(true);
    expect(namesRepayment('TRA GOP DIEN THOAI')).toBe(true);
    expect(namesRepayment('Trả nợ anh Nam')).toBe(true);
    expect(namesRepayment('khoản vay tiêu dùng')).toBe(true);
    expect(namesRepayment('Credit card payment')).toBe(true);
    expect(namesRepayment('Highlands Coffee')).toBe(false);
    expect(namesRepayment('Thanh toan')).toBe(false);
  });
});

describe('billPaymentAsks', () => {
  it('asks about a spend of a bill’s exact amount near its due day', () => {
    const asks = billPaymentAsks(
      [spend({ id: 'a', amount: 5_000_000, day: '2026-10-14' })],
      [bill({ id: 'rent', name: 'Rent' })],
      cycle,
    );
    expect(asks).toEqual([{ spendId: 'a', billId: 'rent' }]);
  });

  it('asks when the payee names the bill, whatever the amount', () => {
    const asks = billPaymentAsks(
      [spend({ id: 'a', amount: 6_100_000, merchant: 'EVN tien dien', note: 'Tiền điện T10' })],
      [bill({ id: 'power', name: 'Tiền điện', amount: 900_000 })],
      cycle,
    );
    expect(asks).toEqual([{ spendId: 'a', billId: 'power' }]);
  });

  it('asks about a card statement of any amount that names a card payment', () => {
    const asks = billPaymentAsks(
      [spend({ id: 'a', amount: 8_000_000, merchant: 'THANH TOAN THE TIN DUNG' })],
      [bill({ id: 'card', name: 'Credit card', amount: 2_000_000, kind: 'card' })],
      cycle,
    );
    expect(asks).toEqual([{ spendId: 'a', billId: 'card' }]);
  });

  it('never matches a repayment word to a bill that pays nothing off', () => {
    const asks = billPaymentAsks(
      [spend({ id: 'a', amount: 3_000_000, merchant: 'Tra gop Home Credit' })],
      [bill({ id: 'rent', name: 'Rent' })],
      cycle,
    );
    expect(asks).toEqual([{ spendId: 'a', billId: null }]);
  });

  it('leaves a spend more than a week from the due day alone', () => {
    const asks = billPaymentAsks(
      [
        spend({ id: 'early', amount: 5_000_000, day: '2026-10-02' }),
        spend({ id: 'late', amount: 5_000_000, day: '2026-10-18' }),
      ],
      [bill({ id: 'rent' })],
      cycle,
    );
    expect(asks).toEqual([]);
  });

  it('asks about each bill once: a paid bill, or one already asked this cycle, is not asked', () => {
    const two = [spend({ id: 'a', amount: 5_000_000 }), spend({ id: 'b', amount: 5_000_000 })];
    expect(billPaymentAsks(two, [bill({ id: 'rent' })], cycle)).toEqual([
      { spendId: 'a', billId: 'rent' },
    ]);
    expect(billPaymentAsks(two, [bill({ id: 'rent', paidCycle: cycle.start })], cycle)).toEqual([]);
    expect(billPaymentAsks(two, [bill({ id: 'rent', askedCycle: cycle.start })], cycle)).toEqual(
      [],
    );
    // Asked last cycle: this cycle may ask again.
    expect(billPaymentAsks(two, [bill({ id: 'rent', askedCycle: '2026-08-25' })], cycle)).toEqual([
      { spendId: 'a', billId: 'rent' },
    ]);
  });

  it('gives each bill the spend that matches it best', () => {
    const asks = billPaymentAsks(
      [
        spend({ id: 'named', amount: 4_000_000, merchant: 'Tien nha thang 10' }),
        spend({ id: 'exact', amount: 5_000_000 }),
      ],
      [bill({ id: 'rent', name: 'Tiền nhà' })],
      cycle,
    );
    expect(asks).toEqual([{ spendId: 'exact', billId: 'rent' }]);
  });

  it('asks "Paying off a card or loan?" about a repayment with no bill to match', () => {
    const asks = billPaymentAsks(
      [spend({ id: 'a', amount: 12_000_000, merchant: 'Credit card payment' })],
      [],
      cycle,
    );
    expect(asks).toEqual([{ spendId: 'a', billId: null }]);
  });

  it('does not ask about a spend already marked as a bill, or a bill that has ended', () => {
    const marked = spend({ id: 'a', amount: 5_000_000, paysBill: REPAYMENT });
    expect(billPaymentAsks([marked], [bill({ id: 'rent' })], cycle)).toEqual([]);
    const ended = bill({ id: 'phone', lastMonth: '2026-09' });
    expect(billPaymentAsks([spend({ id: 'b', amount: 5_000_000 })], [ended], cycle)).toEqual([]);
  });

  it('matches only spends inside the cycle to its bills', () => {
    const before = spend({ id: 'a', amount: 5_000_000, day: '2026-09-20' });
    expect(billPaymentAsks([before], [bill({ id: 'rent', dueDay: 25 })], cycle)).toEqual([]);
  });
});

describe('billChoicesFor', () => {
  const bills = [
    bill({ id: 'rent' }),
    bill({ id: 'card', paidCycle: cycle.start }),
    bill({ id: 'phone' }),
  ];

  it('offers not a bill, each bill still to pay, then a card or loan', () => {
    const fresh = spend({ id: 'a', amount: 250_000 });
    expect(billChoicesFor(fresh, bills, cycle)).toEqual([null, 'rent', 'phone', REPAYMENT]);
  });

  it('never steps onto a bill another payment already paid this cycle', () => {
    const marked = spend({ id: 'a', amount: 250_000, paysBill: 'rent' });
    expect(billChoicesFor(marked, bills, cycle)).not.toContain('card');
  });

  it('keeps the bill the spend itself pays in its place', () => {
    const paying = spend({ id: 'a', amount: 3_500_000, paysBill: 'card' });
    expect(billChoicesFor(paying, bills, cycle)).toEqual([
      null,
      'rent',
      'card',
      'phone',
      REPAYMENT,
    ]);
  });

  it('offers only its own bill for a spend from before this cycle', () => {
    const old = spend({ id: 'a', amount: 250_000, day: '2026-09-20', paysBill: 'phone' });
    expect(billChoicesFor(old, bills, cycle)).toEqual([null, 'phone', REPAYMENT]);
    const plain = spend({ id: 'b', amount: 250_000, day: '2026-09-20' });
    expect(billChoicesFor(plain, bills, cycle)).toEqual([null, REPAYMENT]);
  });
});
