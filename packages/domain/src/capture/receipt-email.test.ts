import { describe, expect, it } from 'vitest';

import { handleOfRecipient, hostOfApiBase, receiptEmailAddress } from '../contracts/receipt-email';
import { decodeEntities, htmlToLines, readForwarded, readSender } from './email-body';
import { parseReceiptEmail, type ReceiptEmail } from './receipt-email';

// Synthetic emails in the shape each bank and shop sends; no real account or person in them.

const receivedAt = '2026-10-10T10:00:00.000Z';
const email = (over: Partial<ReceiptEmail>): ReceiptEmail => ({
  from: null,
  subject: '',
  date: null,
  text: null,
  html: null,
  ...over,
});
const row = (label: string, value: string) => `<tr><td>${label}</td><td><b>${value}</b></td></tr>`;

const vietcombank = email({
  from: { name: 'Vietcombank', address: 'vcbdigibank@info.vietcombank.com.vn' },
  subject: 'Biên lai chuyển tiền qua tài khoản',
  date: '2026-10-09T09:41:02.000Z',
  html: `<html><head><style>td{color:#333}</style></head><body>
    <p>K&iacute;nh gửi Qu&yacute; kh&aacute;ch,</p><p>Vietcombank xin th&ocirc;ng b&aacute;o giao dịch:</p>
    <table>
      ${row('Ngày, giờ giao dịch / Trans. Date, Time', '09/10/2026 16:40:12')}
      ${row('Số lệnh giao dịch / Order Number', 'FT26282917400')}
      ${row('Tài khoản nguồn / Debit Account', '0071xxxx2345')}
      ${row('Tên người hưởng / Beneficiary Name', 'CIRCLE K VIET NAM')}
      ${row('Tên ngân hàng hưởng / Beneficiary Bank', 'Ngân hàng TMCP Quân đội')}
      ${row('Số tiền / Amount', '120,000 VND')}
      ${row('Phí / Charge Amount', '0 VND')}
      ${row('Nội dung chuyển tiền / Details of Payment', 'MUA HANG')}
    </table></body></html>`,
});

const mbForwarded = email({
  from: { name: 'Lan', address: 'lan.example@gmail.com' },
  subject: 'Fwd: Thong bao bien dong so du',
  date: '2026-10-10T06:02:00.000Z',
  text: [
    'Gửi 6pm nhé',
    '',
    '---------- Forwarded message ---------',
    'From: MB Bank <thongbao@mbbank.com.vn>',
    'Date: Sat, Oct 10, 2026 at 12:31 PM',
    'Subject: Thong bao bien dong so du',
    'To: <lan.example@gmail.com>',
    '',
    'TK 0123xxx789 | GD: -45,000VND | 10/10/2026 12:30 | SD: 1,250,000VND',
    'ND: CHUYEN TIEN TOI PHO HOA',
  ].join('\n'),
});

const techcombank = email({
  from: { name: 'Techcombank', address: 'alert@techcombank.com.vn' },
  subject: 'Techcombank: Transaction notification',
  date: '2026-10-09T14:41:00.000Z',
  html: `<div>Dear Customer, your account has a new transaction.</div><table>
      ${row('Account', '1903xxxx0012')}
      ${row('Amount', '- VND 59,000')}
      ${row('Balance', 'VND 3,210,000')}
      ${row('Description', 'Thanh toan QR tai HIGHLANDS COFFEE')}
      ${row('Date', '09/10/2026 21:40')}
    </table>`,
});

const tpbankCredit = email({
  from: { name: 'TPBank', address: 'ebank@tpb.com.vn' },
  subject: 'TPBank thông báo biến động số dư',
  html: `<table>${row('Tài khoản', '0201xxxx999')}${row('Số tiền', '+5,000,000 VND')}${row(
    'Nội dung',
    'LUONG THANG 10',
  )}</table>`,
});

const grab = email({
  from: { name: 'Grab', address: 'no-reply@grab.com' },
  subject: 'Your Grab E-Receipt',
  date: '2026-10-10T06:31:00.000Z',
  html: `<h1>Thanks for riding with Grab</h1><p>Picked up on 10 Oct 2026, 1:30 PM</p>
    <table><tr><td>Fare</td><td>&#8363;35,000</td></tr><tr><td>Platform fee</td><td>&#8363;3,000</td></tr>
    <tr><td>Total</td><td>&#8363;38,000</td></tr></table><p>Paid by MoMo</p>`,
});

const shopeeVi = email({
  from: { name: 'Shopee', address: 'info@mail.shopee.vn' },
  subject: 'Xác nhận đơn hàng #26101099',
  date: '2026-10-10T02:15:00.000Z',
  text: 'Cảm ơn bạn đã mua sắm\nTạm tính: 210.000đ\nPhí vận chuyển: 15.000đ\nTổng thanh toán: 225.000đ',
});

describe('parseReceiptEmail', () => {
  it('reads a Vietcombank transfer receipt from its HTML table, in Vietnam time', () => {
    expect(parseReceiptEmail(vietcombank, { receivedAt })).toEqual({
      amount: 120_000,
      merchant: 'CIRCLE K VIET NAM',
      at: '2026-10-09T09:40:12.000Z',
      from: 'vcbdigibank@info.vietcombank.com.vn',
      bank: 'Vietcombank',
      code: 'FT26282917400',
      memo: 'MUA HANG',
    });
  });

  it('reads an MB Bank balance change forwarded by hand, from the original sender', () => {
    expect(parseReceiptEmail(mbForwarded, { receivedAt })).toEqual({
      amount: 45_000,
      merchant: 'PHO HOA',
      at: '2026-10-10T05:30:00.000Z',
      from: 'thongbao@mbbank.com.vn',
      bank: 'MB Bank',
      code: null,
      memo: 'CHUYEN TIEN TOI PHO HOA',
    });
  });

  it('takes the forwarded Date when the receipt prints no time', () => {
    const noTime = email({
      ...mbForwarded,
      text: (mbForwarded.text ?? '').replace(' | 10/10/2026 12:30', ''),
    });
    expect(parseReceiptEmail(noTime, { receivedAt })?.at).toBe('2026-10-10T05:31:00.000Z');
  });

  it('reads a Techcombank alert in English and names the shop from the description', () => {
    expect(parseReceiptEmail(techcombank, { receivedAt })).toMatchObject({
      amount: 59_000,
      merchant: 'HIGHLANDS COFFEE',
      at: '2026-10-09T14:40:00.000Z',
      bank: 'Techcombank',
    });
  });

  it('skips money coming in', () => {
    expect(parseReceiptEmail(tpbankCredit, { receivedAt })).toBeNull();
  });

  it('reads a Grab e-receipt total, named after the shop', () => {
    expect(parseReceiptEmail(grab, { receivedAt })).toMatchObject({
      amount: 38_000,
      merchant: 'Grab',
      at: '2026-10-10T06:30:00.000Z',
      from: 'no-reply@grab.com',
    });
  });

  it('reads a Shopee order total in Vietnamese and falls back to the Date header', () => {
    expect(parseReceiptEmail(shopeeVi, { receivedAt })).toMatchObject({
      amount: 225_000,
      merchant: 'Shopee',
      at: '2026-10-10T02:15:00.000Z',
    });
  });

  it('reads the payment, not the balance, in a one-line balance change', () => {
    const alert = email({
      from: { name: 'VPBank', address: 'alert@vpbank.com.vn' },
      subject: 'Thông báo biến động số dư',
      text: 'Số dư cuối: 9,950,000 VND\nPhát sinh: -50,000 VND\nNội dung: Thanh toan QR tai PHUC LONG',
    });
    expect(parseReceiptEmail(alert, { receivedAt })).toMatchObject({
      amount: 50_000,
      merchant: 'PHUC LONG',
    });
  });

  it('skips a notice that prints only the balance', () => {
    const notice = email({ subject: 'Số dư tài khoản', text: 'Số dư khả dụng: 9,950,000 VND' });
    expect(parseReceiptEmail(notice, { receivedAt })).toBeNull();
  });

  it('skips an email with no amount in it', () => {
    const newsletter = email({ subject: 'Ưu đãi tháng 10', text: 'Giảm giá cho bạn! Xem ngay.' });
    expect(parseReceiptEmail(newsletter, { receivedAt })).toBeNull();
  });

  it('does not believe a time after the email arrived', () => {
    const late = email({ ...shopeeVi, date: '2026-10-11T02:15:00.000Z' });
    expect(parseReceiptEmail(late, { receivedAt })?.at).toBe(receivedAt);
  });

  it('reads the printed time in another zone when told to', () => {
    const at = parseReceiptEmail(techcombank, { receivedAt, utcOffsetMinutes: 0 })?.at;
    expect(at).toBe('2026-10-09T21:40:00.000Z');
  });
});

describe('email bodies', () => {
  it('turns table cells into label and value, and drops styles and comments', () => {
    const lines = htmlToLines(
      '<style>p{}</style><!-- x --><table><tr><td>Số tiền</td><td>1.000 đ</td></tr></table>',
    );
    expect(lines).toEqual(['Số tiền\t1.000 đ']);
  });

  it('decodes named, accented and numeric entities', () => {
    expect(decodeEntities('Qu&yacute; kh&aacute;ch &amp; &#7871; &#x20AB; &dstrok; &zz;')).toBe(
      'Quý khách & ế ₫ đ &zz;',
    );
  });

  it('reads a sender with or without a name', () => {
    expect(readSender('"Grab" <No-Reply@Grab.com>')).toEqual({
      name: 'Grab',
      address: 'no-reply@grab.com',
    });
    expect(readSender('x@vcb.vn')).toEqual({ name: '', address: 'x@vcb.vn' });
    expect(readSender('nobody')).toBeNull();
  });

  it('takes a Vietnamese Gmail forward block out of the body', () => {
    const read = readForwarded([
      '---------- Thư đã chuyển tiếp ---------',
      'Từ: TPBank <ebank@tpb.com.vn>',
      'Ngày: 10 thg 10, 2026 lúc 12:31',
      'Tiêu đề: Biến động số dư',
      'Tới: <me@example.com>',
      'Số tiền: -20.000 VND',
    ]);
    expect(read.lines).toEqual(['Số tiền: -20.000 VND']);
    expect(read.from?.address).toBe('ebank@tpb.com.vn');
    expect(read.date).toBe('10 thg 10, 2026 lúc 12:31');
  });
});

describe('addresses', () => {
  it('gives at6pm.app the handle alone, and other hosts the shared mailbox', () => {
    expect(receiptEmailAddress('k7m2qx', 'at6pm.app')).toBe('k7m2qx@at6pm.app');
    expect(receiptEmailAddress('k7m2qx', 'dev.at6pm.app')).toBe('r+k7m2qx@dev.at6pm.app');
  });

  it('reads the handle from every address a phone has been given, ignoring case', () => {
    expect(handleOfRecipient('K7M2QX@at6pm.app')).toBe('k7m2qx');
    expect(handleOfRecipient('r+k7m2qx@dev.at6pm.app')).toBe('k7m2qx');
    expect(handleOfRecipient('k7m2q9xd4p@at6pm.app')).toBe('k7m2q9xd4p');
    expect(handleOfRecipient('Receipts+K7M2Q9XD4P@6pm.oddeggs.studio')).toBe('k7m2q9xd4p');
  });

  it('refuses other mailboxes and anything that cannot be a handle', () => {
    expect(handleOfRecipient('postmaster@at6pm.app')).toBeNull();
    expect(handleOfRecipient('hello@at6pm.app')).toBeNull();
    expect(handleOfRecipient('hello+k7m2qx@at6pm.app')).toBeNull();
    expect(handleOfRecipient('r@dev.at6pm.app')).toBeNull();
    expect(handleOfRecipient('receipts@6pm.oddeggs.studio')).toBeNull();
    // `l` and `1` are not in the alphabet; 7 and 9 places are neither length.
    expect(handleOfRecipient('k7m2ql@at6pm.app')).toBeNull();
    expect(handleOfRecipient('k7m2qxa@at6pm.app')).toBeNull();
    expect(handleOfRecipient('r+k7m2q9xd4@dev.at6pm.app')).toBeNull();
  });

  it('reads the host of an API base', () => {
    expect(hostOfApiBase('https://dev.at6pm.app/api')).toBe('dev.at6pm.app');
    expect(hostOfApiBase('not a url')).toBeNull();
  });
});
