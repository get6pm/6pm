import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  parseBankReceipt,
  readReceiptTime,
  receiptReadingOrder,
  type BankReceipt,
  type ReceiptLine,
} from './bank-receipt';
import acb from './fixtures/receipts/synthetic-acb.json';
import bidv from './fixtures/receipts/synthetic-bidv.json';
import mbbank from './fixtures/receipts/synthetic-mbbank.json';
import momo from './fixtures/receipts/synthetic-momo.json';
import pdf from './fixtures/receipts/synthetic-pdf-vietcombank.json';
import techcombank from './fixtures/receipts/synthetic-techcombank.json';
import textShare from './fixtures/receipts/synthetic-text-share.json';
import vietcombank from './fixtures/receipts/synthetic-vietcombank.json';
import vpbank from './fixtures/receipts/synthetic-vpbank.json';

/** Receipts print the phone's local time; the expected instant is built the same way. */
const local = (h: number, m: number, s = 0) => new Date(2026, 9, 9, h, m, s).toISOString();

const fixtures: [string, readonly ReceiptLine[], BankReceipt][] = [
  [
    'MB Bank: labels left, values right, the payee bank in a row',
    mbbank,
    {
      amount: 120_000,
      payee: 'CIRCLE K VN',
      payeeSure: false,
      at: local(16, 40),
      code: 'FT26282917400',
      bank: 'MB Bank',
    },
  ],
  [
    'Vietcombank: the time under the amount with no label',
    vietcombank,
    {
      amount: 120_000,
      payee: 'CIRCLE K VN',
      payeeSure: false,
      at: local(16, 40),
      code: '5123456789',
      bank: 'Vietcombank',
    },
  ],
  [
    'Techcombank: each label above its value',
    techcombank,
    {
      amount: 85_000,
      payee: 'Phở Hòa Pasteur',
      payeeSure: true,
      at: local(12, 5),
      code: 'FT2628255104811',
      bank: 'Techcombank',
    },
  ],
  [
    'VPBank: a company name and the balance printed under it',
    vpbank,
    {
      amount: 250_000,
      payee: 'CONG TY TNHH THE COFFEE HOUSE',
      payeeSure: false,
      at: local(8, 15, 42),
      code: 'VPB2628291023',
      bank: 'VPBank',
    },
  ],
  [
    'ACB: a labelled amount, a fee, the bank only in the footer, a name read unsurely',
    acb,
    {
      amount: 1_250_000,
      payee: 'Nha Thuoc Long Chau',
      payeeSure: false,
      at: local(19, 22),
      code: '2026100912345',
      bank: 'ACB',
    },
  ],
  [
    'BIDV: label and value in one line',
    bidv,
    {
      amount: 45_000,
      payee: 'NGUYEN THI HOA',
      payeeSure: false,
      at: local(7, 31, 5),
      code: '2628291740123',
      bank: 'BIDV',
    },
  ],
  [
    'MoMo: a shop name as the shop writes it',
    momo,
    {
      amount: 55_000,
      payee: 'Bánh Mì Huỳnh Hoa',
      payeeSure: true,
      at: local(18, 2),
      code: '41234567890',
      bank: 'MoMo',
    },
  ],
  [
    'a PDF receipt with bilingual labels',
    pdf,
    {
      amount: 120_000,
      payee: 'CIRCLE K VIET NAM',
      payeeSure: false,
      at: local(16, 40, 12),
      code: '5123456789',
      bank: 'Vietcombank',
    },
  ],
  [
    'a text share with no labels and the balance after it',
    textShare,
    {
      amount: 65_000,
      payee: 'GRAB VIETNAM',
      payeeSure: false,
      at: local(21, 14),
      code: 'FT26282012345',
      bank: 'Techcombank',
    },
  ],
];

describe('parseBankReceipt', () => {
  it.each(fixtures)('reads %s', (_, lines, expected) => {
    expect(parseBankReceipt(lines)).toEqual(expected);
  });

  it('reads the same receipt whatever order the lines arrive in', () => {
    const expected = parseBankReceipt(techcombank);
    fc.assert(
      fc.property(
        fc.shuffledSubarray([...techcombank], { minLength: techcombank.length }),
        (lines) => {
          expect(parseBankReceipt(lines)).toEqual(expected);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('has nothing for a page that is not a receipt', () => {
    expect(parseBankReceipt([])).toBeNull();
    expect(parseBankReceipt([{ text: 'Hello' }, { text: 'Chúc mừng sinh nhật' }])).toBeNull();
  });

  it('is unsure of a name read with low confidence', () => {
    const lines = [{ text: 'Người nhận' }, { text: 'Phở Hòa', confidence: 0.3 }];
    expect(parseBankReceipt(lines)).toMatchObject({ payee: 'Phở Hòa', payeeSure: false });
  });

  it('takes the account number off a name', () => {
    expect(parseBankReceipt([{ text: 'Người nhận: Phở Hòa - 0123456789' }])?.payee).toBe('Phở Hòa');
    expect(parseBankReceipt([{ text: 'Người nhận: 0123456789' }])).toBeNull();
  });

  it('reads English labels', () => {
    const lines = [
      { text: 'Amount: 45,000 VND' },
      { text: 'Beneficiary: Highlands Coffee' },
      { text: 'Transaction ID: 9876543210' },
      { text: 'Date: 9 Oct 2026, 4:40 PM' },
    ];
    expect(parseBankReceipt(lines)).toEqual({
      amount: 45_000,
      payee: 'Highlands Coffee',
      payeeSure: true,
      at: local(16, 40),
      code: '9876543210',
      bank: null,
    });
  });

  it('never throws on anything the recogniser could give', () => {
    const box = fc.record({
      x: fc.double({ min: 0, max: 1, noNaN: true }),
      y: fc.double({ min: 0, max: 1, noNaN: true }),
      w: fc.double({ min: 0, max: 1, noNaN: true }),
      h: fc.double({ min: 0, max: 0.1, noNaN: true }),
    });
    const line = fc.record({ text: fc.string({ maxLength: 40 }), box }, { requiredKeys: ['text'] });
    fc.assert(
      fc.property(fc.array(line, { maxLength: 20 }), (lines) => {
        const receipt = parseBankReceipt(lines);
        if (receipt?.amount != null) expect(Number.isSafeInteger(receipt.amount)).toBe(true);
      }),
    );
  });
});

describe('receiptReadingOrder', () => {
  it('reads rows top to bottom, each left to right', () => {
    expect(receiptReadingOrder(mbbank).slice(0, 4)).toEqual([
      '16:41 87%',
      'MBBank',
      'Chuyển tiền thành công',
      '120,000 VND',
    ]);
  });
});

describe('readReceiptTime', () => {
  it.each([
    ['16:40 Thứ Sáu 09/10/2026', local(16, 40)],
    ['09/10/2026 16:40:12', local(16, 40, 12)],
    ['16:40 - 09/10/2026', local(16, 40)],
    ['09-10-2026 16:40', local(16, 40)],
    ['2026-10-09 16:40', local(16, 40)],
    ['9 Oct 2026, 4:40 PM', local(16, 40)],
    ['09/10/2026 04:40 CH', local(16, 40)],
    ['09/10/2026', local(12, 0)],
  ])('reads %j', (text, at) => {
    expect(readReceiptTime(text)).toBe(at);
  });

  it.each([['16:40'], ['31/02/2026 10:00'], ['09/10/2026 25:10'], ['']])(
    'has no time in %j',
    (text) => {
      expect(readReceiptTime(text)).toBeNull();
    },
  );
});
