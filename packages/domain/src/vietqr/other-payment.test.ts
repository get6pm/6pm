import { describe, expect, it } from 'vitest';

import { readOtherPayment } from './other-payment';
import { parseVietQR } from './parse-vietqr';

/** Shapes from each scheme's published specification and its documented examples. */
const CODES = {
  upi: 'upi://pay?pa=chaiwala@okaxis&pn=Chai%20Wala&am=40.00&cu=INR&tn=two+chai',
  upiOpen: 'UPI://pay?pa=chaiwala@okaxis&pn=Chai+Wala',
  /** The EPC's own example: a donation to Wikimedia Germany. */
  epc: 'BCD\n002\n1\nSCT\nBFSWDE33BER\nWikimedia Foerdergesellschaft\nDE33 1002 0500 0001 1947 00\nEUR123.45\n\n\nSpende fuer Wikipedia',
  epcOpen: 'BCD\r\n001\r\n1\r\nSCT\r\n\r\nBoulangerie Martin\r\nFR7630006000011234567890189\r\n',
  /** SIX's sample QR-bill (Swiss Payment Standards, example 1). */
  swiss: [
    'SPC',
    '0200',
    '1',
    'CH4431999123000889012',
    'S',
    'Robert Schneider AG',
    'Rue du Lac',
    '1268',
    '2501',
    'Biel',
    'CH',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '1949.75',
    'CHF',
    'S',
    'Pia-Maria Rutschmann-Schnyder',
    'Grosse Marktgasse',
    '28',
    '9400',
    'Rorschach',
    'CH',
    'QRR',
    '210000000003139471430009017',
    'Order of 15 June 2020',
    'EPD',
  ].join('\n'),
  spayd:
    'SPD*1.0*ACC:CZ5855000000001265098001*AM:480.50*CC:CZK*MSG:PLATBA ZA ZBOZI*RN:Kavarna%20Slavia',
  alipay: 'https://qr.alipay.com/fkx18925mxqvwtlwrpsee47',
  wechat: 'wxp://f2f0dpGDK4bMhXyE3pG_kv9cH8B4nC9VTzA',
  twqr: 'TWQRP://Coffee/158/01/V1?D1=12000&D3=AbCdEf',
  paypay: 'https://qr.paypay.ne.jp/28180104fLpXOwAT9u7dAqPw',
};

describe('readOtherPayment', () => {
  it('reads a UPI link: payee, rupees and amount', () => {
    expect(readOtherPayment(CODES.upi)).toEqual({
      scheme: 'upi',
      country: 'IN',
      currency: 'INR',
      amount: '40.00',
      merchantName: 'Chai Wala',
    });
    expect(readOtherPayment(CODES.upiOpen)).toEqual({
      scheme: 'upi',
      country: 'IN',
      currency: 'INR',
      merchantName: 'Chai Wala',
    });
  });

  it('reads a SEPA transfer code: the IBAN’s country, euros and the amount', () => {
    expect(readOtherPayment(CODES.epc)).toEqual({
      scheme: 'epc',
      country: 'DE',
      currency: 'EUR',
      amount: '123.45',
      merchantName: 'Wikimedia Foerdergesellschaft',
    });
    expect(readOtherPayment(CODES.epcOpen)).toEqual({
      scheme: 'epc',
      country: 'FR',
      currency: 'EUR',
      merchantName: 'Boulangerie Martin',
    });
  });

  it('reads a Swiss QR-bill', () => {
    expect(readOtherPayment(CODES.swiss)).toEqual({
      scheme: 'swissqr',
      country: 'CH',
      currency: 'CHF',
      amount: '1949.75',
      merchantName: 'Robert Schneider AG',
    });
  });

  it('reads a Czech QR Platba', () => {
    expect(readOtherPayment(CODES.spayd)).toEqual({
      scheme: 'spayd',
      country: 'CZ',
      currency: 'CZK',
      amount: '480.50',
      merchantName: 'Kavarna Slavia',
    });
  });

  it.each([
    ['Alipay', CODES.alipay, 'alipay', 'CN', 'CNY'],
    ['WeChat Pay', CODES.wechat, 'wechat', 'CN', 'CNY'],
    ['Taiwan Pay', CODES.twqr, 'twqr', 'TW', 'TWD'],
    ['PayPay', CODES.paypay, 'paypay', 'JP', 'JPY'],
  ])('recognises a %s shop code, with no amount', (_name, code, scheme, country, currency) => {
    expect(readOtherPayment(code)).toEqual({ scheme, country, currency });
  });

  it('leaves anything else alone', () => {
    expect(readOtherPayment('https://example.com/pay')).toBeNull();
    expect(readOtherPayment('BCD\n002\n1\nXYZ\n')).toBeNull();
    expect(readOtherPayment('SPC\n0200\n1\nDE33100205000001194700')).toBeNull();
  });

  it('keeps no amount that is not a plain positive decimal', () => {
    expect(readOtherPayment('upi://pay?pa=a@b&am=1,000')).not.toHaveProperty('amount');
    expect(readOtherPayment('upi://pay?pa=a@b&am=0')).not.toHaveProperty('amount');
  });

  it('reaches Scan as a foreign QR', () => {
    expect(parseVietQR(CODES.upi)).toMatchObject({
      ok: false,
      reason: 'foreign',
      scheme: 'upi',
      currency: 'INR',
      amount: '40.00',
    });
    expect(parseVietQR('hello')).toEqual({ ok: false, reason: 'not_emv' });
  });
});
