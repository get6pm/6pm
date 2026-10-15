import { describe, expect, it } from 'vitest';

import { receiptReadingOrder, type ReceiptLine } from './bank-receipt';
import acb from './fixtures/receipts/synthetic-acb.json';
import mbbank from './fixtures/receipts/synthetic-mbbank.json';
import textShare from './fixtures/receipts/synthetic-text-share.json';
import bacHien from './fixtures/receipts/shop-bac-hien-kiotviet.json';
import bejana from './fixtures/receipts/shop-bejana-uluwatu-no-mark.json';
import bwResto from './fixtures/receipts/shop-bw-resto-bali-rupiah.json';
import coffeeBean from './fixtures/receipts/shop-coffee-bean-singapore.json';
import coffeeHouseQ12 from './fixtures/receipts/shop-coffee-house-q12.json';
import coffeeHouseVoucher from './fixtures/receipts/shop-coffee-house-voucher.json';
import cukcuk from './fixtures/receipts/shop-cukcuk-promotion.json';
import grabfood from './fixtures/receipts/shop-grabfood-analy.json';
import handwritten from './fixtures/receipts/shop-handwritten-bali.json';
import johnnyRockets from './fixtures/receipts/shop-johnny-rockets-bali.json';
import jumi from './fixtures/receipts/shop-jumi-bali-rupiah.json';
import kelingking from './fixtures/receipts/shop-kelingking-bali-no-mark.json';
import mrCrab from './fixtures/receipts/shop-mr-crab.json';
import omNuong from './fixtures/receipts/shop-om-nuong.json';
import poleng from './fixtures/receipts/shop-poleng-bali-folio.json';
import starbucks from './fixtures/receipts/shop-starbucks-vivo-city.json';
import tirtaEmpul from './fixtures/receipts/shop-tirta-empul-ticket.json';
import toanTri from './fixtures/receipts/shop-toan-tri-ipos.json';
import vnpayBeerHall from './fixtures/receipts/shop-vnpay-beer-hall.json';
import { readReceipt } from './read-receipt';

/** Receipts print the phone's local time; the expected instant is built the same way. */
const local = (y: number, mo: number, d: number, h: number, mi: number, s = 0) =>
  new Date(y, mo - 1, d, h, mi, s).toISOString();

interface Truth {
  /** What was paid, in the receipt's own currency, as a decimal. */
  readonly total: string;
  readonly currency: string;
  /** Asserted only where the header prints the name plainly enough to read. */
  readonly merchant?: string;
  /** Asserted only where the receipt prints when it was paid. */
  readonly at?: string;
  /**
   * The photo misreads the total itself (a digit read wrong): the reading must then say it is
   * unsure, so it is checked again rather than saved quietly.
   */
  readonly misread?: true;
}

/** Real photographed receipts, read by Vision with the share extension's settings. */
const shops: [string, readonly ReceiptLine[], Truth][] = [
  [
    'a GrabFood order slip whose total is smudged: subtotal less the discount',
    grabfood,
    {
      total: '101500',
      currency: 'VND',
      merchant: 'Cơm Gà Hải Nam Tam Kỳ 142 - Bình Chánh',
      at: local(2026, 9, 30, 18, 47),
    },
  ],
  [
    'a Singapore café: cents, the card line and change below the total',
    coffeeBean,
    {
      total: '68.8',
      currency: 'SGD',
      merchant: 'The Coffee Bean & Tea Leaf',
      at: local(2026, 8, 29, 19, 14),
    },
  ],
  [
    'a Bali bar with no currency printed, only a +62 phone',
    kelingking,
    {
      total: '935550',
      currency: 'IDR',
      merchant: 'KELINGKING BAR & RESTAURANT',
      at: local(2026, 8, 30, 8, 38, 10),
    },
  ],
  [
    'a Bali seafood bill in rupiah',
    bwResto,
    { total: '796000', currency: 'IDR', merchant: 'B&w Resto Seatood' },
  ],
  [
    'a hotel restaurant slip over its printed folio',
    poleng,
    { total: '1091420', currency: 'IDR', merchant: 'POLENG RESTAURANT' },
  ],
  ['a handwritten Indonesian bill', handwritten, { total: '755700', currency: 'IDR' }],
  [
    'a Bali takeaway bill printing Rp on every amount',
    jumi,
    { total: '496650', currency: 'IDR', at: local(2026, 9, 2, 11, 55) },
  ],
  [
    // The total as the phone read it ("368,160"); the place is only in the logo, misread.
    'an Uluwatu pre-invoice with no currency and no readable place',
    bejana,
    { total: '368160', currency: 'IDR', merchant: 'be ja na' },
  ],
  ['an airport burger bill', johnnyRockets, { total: '647378', currency: 'IDR', misread: true }],
  [
    'a temple ticket',
    tirtaEmpul,
    { total: '225000', currency: 'IDR', at: local(2026, 9, 3, 13, 18, 6) },
  ],
  ['a Saigon diner with cash and change', toanTri, { total: '1875000', currency: 'VND' }],
  [
    'a grill house with VAT lines',
    omNuong,
    { total: '2810580', currency: 'VND', merchant: 'OM NƯỚNG', at: local(2024, 7, 12, 19, 17) },
  ],
  [
    'a KiotViet bill whose total sits a line above its label',
    bacHien,
    { total: '1103000', currency: 'VND', merchant: 'QUÁN BÁC HIỀN', at: local(2025, 7, 3, 9, 0) },
  ],
  [
    'a café bill with a voucher',
    coffeeHouseVoucher,
    {
      total: '105000',
      currency: 'VND',
      merchant: 'THE COFFEE HOUSE',
      at: local(2019, 4, 16, 18, 54),
    },
  ],
  [
    'a seafood bill with cash handed over',
    mrCrab,
    {
      total: '2880000',
      currency: 'VND',
      merchant: 'BỜ KE MR. CRAB',
      at: local(2025, 5, 10, 13, 28),
    },
  ],
  [
    'a beer hall bill with discounts and two VAT rates',
    vnpayBeerHall,
    { total: '4236020', currency: 'VND' },
  ],
  ['a CukCuk bill with a promotion, skewed', cukcuk, { total: '1260000', currency: 'VND' }],
  [
    'a Saigon chain café in English',
    starbucks,
    { total: '89000', currency: 'VND', at: local(2024, 9, 1, 15, 37) },
  ],
  [
    'a café bill whose voucher line took the wrong amount',
    coffeeHouseQ12,
    {
      total: '55000',
      currency: 'VND',
      merchant: 'THE COFFEE HOUSE',
      at: local(2018, 9, 15, 13, 50),
    },
  ],
];

describe('readReceipt on shop receipts', () => {
  it.each(shops)('reads %s', (_, lines, truth) => {
    const read = readReceipt(lines);
    expect(read?.kind).toBe('shop');
    const total = read?.currency === 'VND' ? String(read.amount) : read?.foreign?.amount;
    if (truth.misread) {
      expect(read?.totalSure).toBe(false);
      return;
    }
    expect({ total, currency: read?.currency }).toEqual({
      total: truth.total,
      currency: truth.currency,
    });
    if (truth.merchant !== undefined) expect(read?.payee).toBe(truth.merchant);
    if (truth.at !== undefined) expect(read?.at).toBe(truth.at);
  });

  it('points at the row the total was read from', () => {
    const read = readReceipt(coffeeBean);
    expect(receiptReadingOrder(coffeeBean)[read?.totalLine ?? -1]).toBe('TOTAL DINE IN 68.80');
  });

  it('is unsure of a total it worked out rather than read', () => {
    expect(readReceipt(grabfood)).toMatchObject({ totalSure: false, totalLine: null });
  });

  it('is unsure of a currency it inferred from where the receipt was printed', () => {
    expect(readReceipt(kelingking)).toMatchObject({ currency: 'IDR', currencySure: false });
    expect(readReceipt(bwResto)).toMatchObject({ currency: 'IDR', currencySure: true });
  });

  it('never reads an amount with cents as đồng', () => {
    const lines = [{ text: 'Coffee' }, { text: 'TOTAL 4.50' }, { text: 'Tea 3.20' }];
    expect(readReceipt(lines)).toMatchObject({ currency: null, amount: null, foreign: null });
  });

  it('takes the trip currency when the receipt says nothing', () => {
    const lines = [{ text: 'Coffee 4.50' }, { text: 'TOTAL 4.50' }];
    expect(readReceipt(lines, 'SGD')).toMatchObject({
      currency: 'SGD',
      currencySure: false,
      foreign: { currency: 'SGD', amount: '4.5' },
    });
  });

  it('lets the receipt overrule the trip', () => {
    expect(readReceipt(omNuong, 'THB')).toMatchObject({ currency: 'VND', amount: 2_810_580 });
  });
});

describe('the currency of a receipt that prints none', () => {
  it('lets a printed mark beat where the photo was taken', () => {
    expect(readReceipt(jumi, null, 'USD')).toMatchObject({ currency: 'IDR', currencySure: true });
    expect(readReceipt(grabfood, null, 'IDR')).toMatchObject({
      currency: 'VND',
      currencySure: true,
    });
  });

  it('lets where the photo was taken beat the place the text names, as a guess', () => {
    expect(readReceipt(kelingking, null, 'USD')).toMatchObject({
      currency: 'USD',
      currencySure: false,
    });
    expect(readReceipt(bejana, null, 'IDR')).toMatchObject({
      currency: 'IDR',
      currencySure: false,
      foreign: { currency: 'IDR', amount: '368160' },
    });
  });

  it('lets where the photo was taken beat the trip', () => {
    const lines = [{ text: 'Coffee 4.50' }, { text: 'TOTAL 4.50' }];
    expect(readReceipt(lines, 'SGD', 'THB')).toMatchObject({
      currency: 'THB',
      currencySure: false,
    });
  });

  it('never takes đồng from the place when the amounts carry cents', () => {
    const lines = [{ text: 'Coffee 4.50' }, { text: 'TOTAL 4.50' }];
    expect(readReceipt(lines, 'SGD', 'VND')).toMatchObject({ currency: 'SGD' });
  });

  it.each(['Uluwatu', 'Canggu', 'Seminyak', 'Denpasar', 'Labuan Bajo', 'Yogyakarta', 'Gili'])(
    'reads %s on a bill as a guess at rupiah',
    (place) => {
      const lines = [{ text: place }, { text: 'Nasi goreng 55,000' }, { text: 'TOTAL 55,000' }];
      expect(readReceipt(lines)).toMatchObject({ currency: 'IDR', currencySure: false });
    },
  );
});

describe('readReceipt on transfers', () => {
  it.each([
    ['MB Bank', mbbank, 120_000],
    ['ACB', acb, 1_250_000],
    ['a text share', textShare, 65_000],
  ] as const)('reads a %s transfer as before, in đồng', (_, lines, amount) => {
    expect(readReceipt(lines, 'SGD')).toMatchObject({
      kind: 'transfer',
      amount,
      currency: 'VND',
      currencySure: true,
      foreign: null,
    });
  });
});
