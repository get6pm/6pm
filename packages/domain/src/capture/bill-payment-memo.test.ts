import { describe, expect, it } from 'vitest';

import { emailCaptureSchema } from '../contracts/receipt-email';
import { contextMoney } from '../native/context-money';
import { buildShareCard, buildShareItem } from '../native/share-card';
import { payCycleOn } from '../plan/pay-cycle';
import { billPaymentAsks, type PayableBill } from './bill-payment';
import { inboxItemToNewSpend } from './inbox';
import { parseReceiptEmail } from './receipt-email';

// 25 Sep → 25 Oct; the card bill falls due on the 10th.
const cycle = payCycleOn('2026-10-10', { kind: 'sameDay', day: 25 });
const card: PayableBill = {
  id: 'card',
  name: 'VPBank',
  amount: 2_000_000,
  dueDay: 10,
  kind: 'card',
  paidCycle: null,
};

// A transfer to the card's own account: the payee is a bare account name, and only the memo says
// what it paid.
const receiptLines = [
  { text: 'Chuyển tiền thành công' },
  { text: 'Số tiền: 8.000.000 VND' },
  { text: 'Người nhận: NGUYEN VAN AN' },
  { text: 'Nội dung: Thanh toan the tin dung' },
  { text: 'Thời gian: 10/10/2026 09:15' },
  { text: 'Mã giao dịch: FT26283001122' },
];

describe('a repayment named only in the memo', () => {
  it('reaches the close from a shared receipt, which asks about the card bill', () => {
    const now = new Date(2026, 9, 10, 9, 30);
    const shown = buildShareCard(receiptLines, null, now);
    expect(shown.memo).toBe('Thanh toan the tin dung');
    const item = buildShareItem(
      shown,
      {},
      '5f0c3c38-7a52-4f0e-9a1d-2d2b6a4c9e10',
      contextMoney(null),
    );
    expect(item?.receipt?.memo).toBe('Thanh toan the tin dung');
    if (item === null) throw new Error('no item');
    const draft = inboxItemToNewSpend(
      item,
      { ruleCategoryId: null, fallbackCategoryId: 'food', categoryIds: new Set(['food']) },
      now,
    );
    expect(draft.memo).toBe('Thanh toan the tin dung');
    const spend = { ...draft, day: '2026-10-10' as const };
    expect(billPaymentAsks([spend], [card], cycle)).toEqual([{ spendId: item.id, billId: 'card' }]);
  });

  it('reaches the close from a receipt email, which asks about the card bill', () => {
    const read = parseReceiptEmail(
      {
        from: { name: 'MB Bank', address: 'thongbao@mbbank.com.vn' },
        subject: 'Thong bao bien dong so du',
        date: '2026-10-10T02:16:00.000Z',
        html: null,
        text: [
          'TK 0123xxx789 | GD: -8,000,000VND | 10/10/2026 09:15 | SD: 1,250,000VND',
          'Nội dung: Thanh toan the tin dung',
        ].join('\n'),
      },
      { receivedAt: '2026-10-10T03:00:00.000Z' },
    );
    expect(read?.memo).toBe('Thanh toan the tin dung');
    if (read === null) throw new Error('not read');
    // What the server seals and the phone fetches keeps it.
    const capture = emailCaptureSchema.parse({ id: 'abcdefghijklmnop', ...read });
    const spend = {
      id: capture.id,
      day: '2026-10-10' as const,
      amount: capture.amount,
      merchant: capture.merchant,
      note: null,
      memo: capture.memo ?? null,
    };
    expect(billPaymentAsks([spend], [card], cycle)).toEqual([
      { spendId: capture.id, billId: 'card' },
    ]);
  });

  it('still asks "Paying off a card or loan?" from the memo when no bill matches', () => {
    const spend = {
      id: 'a',
      day: '2026-10-10' as const,
      amount: 8_000_000,
      merchant: 'NGUYEN VAN AN',
      note: null,
      memo: 'Thanh toan the tin dung',
    };
    expect(billPaymentAsks([spend], [], cycle)).toEqual([{ spendId: 'a', billId: null }]);
  });

  it('asks nothing about the same transfer with no memo', () => {
    const spend = {
      id: 'a',
      day: '2026-10-10' as const,
      amount: 8_000_000,
      merchant: 'NGUYEN VAN AN',
      note: null,
    };
    expect(billPaymentAsks([spend], [card], cycle)).toEqual([]);
  });
});
