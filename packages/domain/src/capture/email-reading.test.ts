import { describe, expect, it } from 'vitest';

import {
  emailModelText,
  emailSpendOf,
  mayHoldPayment,
  type EmailModelReading,
} from './email-reading';
import type { ReceiptEmail } from './receipt-email';

// Synthetic emails in the shape each bank and shop sends; no real account or person in them.

const receivedAt = '2026-10-16T05:00:00.000Z';
const options = { receivedAt };

const cardAlert: ReceiptEmail = {
  from: { name: 'Vietcombank', address: 'info@info.vietcombank.com.vn' },
  subject: 'Thông báo giao dịch thẻ/ Vietcombank card transaction notification',
  date: '2026-10-16T03:25:38.000Z',
  text: [
    '| Thẻ Card | Visa 400000...0001 |',
    '| Sử dụng tại At | APPLE.COM/US 800-000-0000 US |',
    '| Số tiền Transaction Amount | 99 USD |',
    '| Ngày, giờ giao dịch Trans. Date, Time | 16-10-2026 10:25:31 |',
    '| Tình trạng giao dịch Status of Transaction | Thành công |',
  ].join('\n'),
  html: null,
};

const shopReceipt: ReceiptEmail = {
  from: { name: 'Shopee', address: 'info@mail.shopee.vn' },
  subject: 'Xác nhận thanh toán thành công',
  date: '2026-10-16T03:25:35.000Z',
  text: null,
  html: `<table>
    <tr><td>Người bán:</td><td>meo.petshop</td></tr>
    <tr><td>Tổng tiền:</td><td>₫709,830</td></tr>
    <tr><td>Voucher từ Shopee:</td><td>₫82,540</td></tr>
    <tr><td>Tổng thanh toán:</td><td>₫607,790</td></tr>
  </table>`,
};

const payment = (over: Partial<EmailModelReading>): EmailModelReading => ({
  kind: 'payment',
  amount: null,
  currency: null,
  merchant: null,
  category: null,
  at: null,
  reference: null,
  note: null,
  ...over,
});

describe('a receipt email read by a model', () => {
  it('keeps a foreign card charge in its own currency, at the time the bank printed', () => {
    const spend = emailSpendOf(
      payment({ amount: '99 USD', currency: 'usd', merchant: 'Apple', at: '2026-10-16T10:25:31' }),
      cardAlert,
      options,
    );
    expect(spend).toMatchObject({
      amount: 9900,
      currency: 'USD',
      merchant: 'Apple',
      at: '2026-10-16T03:25:31.000Z',
      from: 'info@info.vietcombank.com.vn',
      bank: 'Vietcombank',
    });
  });

  it('takes the amount actually paid, and the category when it is a starter one', () => {
    const spend = emailSpendOf(
      payment({
        amount: '₫607,790',
        currency: 'VND',
        merchant: 'meo.petshop',
        category: 'Shopping',
        reference: '#261016ABCDEF',
      }),
      shopReceipt,
      options,
    );
    expect(spend).toMatchObject({
      amount: 607_790,
      currency: 'VND',
      category: 'shopping',
      code: '#261016ABCDEF',
      at: '2026-10-16T03:25:35.000Z',
    });
  });

  it('never takes an amount the email does not print', () => {
    const madeUp = payment({ amount: '₫600,000', currency: 'VND', merchant: 'meo.petshop' });
    expect(emailSpendOf(madeUp, shopReceipt, options)).toBeNull();
  });

  it('drops anything that is not a payment out', () => {
    for (const kind of ['own_transfer', 'refund', 'failed', 'order_update', 'promo'] as const) {
      const reading = payment({ kind, amount: '₫607,790', currency: 'VND' });
      expect(emailSpendOf(reading, shopReceipt, options)).toBeNull();
    }
  });

  it('drops a payment with no currency it can name, and keeps no category it does not know', () => {
    expect(emailSpendOf(payment({ amount: '99 USD', currency: null }), cardAlert, options)).toBe(
      null,
    );
    const spend = emailSpendOf(
      payment({ amount: '99 USD', currency: 'USD', category: 'software' }),
      cardAlert,
      options,
    );
    expect(spend?.category).toBeNull();
  });

  it('does not believe a printed time later than the email arrived', () => {
    const spend = emailSpendOf(
      payment({ amount: '99 USD', currency: 'USD', at: '2026-10-17T10:25:31' }),
      cardAlert,
      options,
    );
    expect(spend?.at).toBe('2026-10-16T03:25:38.000Z');
  });

  it('sends the model only an email that prints an amount', () => {
    for (const printed of [
      'Số tiền giao dịch | (VND) 700,000.00',
      'Tổng thanh toán: ₫607,790',
      'Transaction Amount | 99 USD',
      'Bạn đã trả 10,00 $ USD cho wavespeed',
      'Khoản thanh toán\n179.000',
      'BẠN TRẢ | 158000₫',
    ]) {
      expect(mayHoldPayment({ ...cardAlert, subject: '', text: printed })).toBe(true);
    }
    for (const none of [
      'Your verification code is 258127',
      '[FIRING:3] Command round trip p95 is above the 300 ms budget.',
      'Ngày 16-10-2026 10:25:31, hotline 1900 545426',
    ]) {
      expect(mayHoldPayment({ ...cardAlert, subject: '', text: none })).toBe(false);
    }
  });

  it('gives the model the sender and the email’s lines, not its markup', () => {
    const text = emailModelText(shopReceipt);
    expect(text).toContain('From: Shopee <info@mail.shopee.vn>');
    expect(text).toContain('Tổng thanh toán:');
    expect(text).not.toContain('<td>');
  });
});
