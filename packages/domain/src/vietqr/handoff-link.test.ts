import { describe, expect, it } from 'vitest';

import { findBank } from './bank-catalogue';
import { encodeVietQR } from './encode-vietqr';
import { handoffUrl, payloadFor, transferLink } from './handoff-link';
import { parseVietQR, type VietQR } from './parse-vietqr';

function scan(payload: string): VietQR {
  const result = parseVietQR(payload);
  if (!result.ok) throw new Error(`expected a VietQR, got ${result.reason}`);
  return result;
}

function app(id: string) {
  const ios = findBank(id)?.ios;
  if (!ios) throw new Error(`no iOS app for ${id}`);
  return ios;
}

/** The query value after `name=` in a link, decoded. */
function param(link: string, name: string): string | null {
  const value = new RegExp(`[?&]${name}=([^&]*)`).exec(link)?.[1];
  return value === undefined ? null : decodeURIComponent(value);
}

const transfer = scan(
  encodeVietQR({ bin: '970403', account: '060101453998', amount: 10_000, note: 'an trua' }),
);
const open = scan(encodeVietQR({ bin: '970403', account: '060101453998', note: 'an trua' }));
const shop: VietQR = { ...transfer, service: 'merchant' };

describe('payloadFor', () => {
  it('passes the scanned code on untouched when it already asks for this amount', () => {
    expect(payloadFor(transfer, 10_000)).toBe(transfer.raw);
  });

  it('writes the typed amount into a transfer to an account', () => {
    const written = scan(payloadFor(open, 45_000));
    expect(written).toMatchObject({
      bin: '970403',
      account: '060101453998',
      amount: 45_000,
      note: 'an trua',
      service: 'account',
    });
  });

  it('never rewrites a shop code', () => {
    expect(payloadFor(shop, 99_000)).toBe(shop.raw);
  });
});

describe('transferLink', () => {
  it('builds the QR-pay link most banks share', () => {
    const link = transferLink(app('MB'), transfer, 10_000);
    expect(link?.startsWith('mbbank://applink?targetPage=QRPay&qrContent=')).toBe(true);
    expect(link && param(link, 'qrContent')).toBe(transfer.raw);
  });

  it("uses VietinBank's own path", () => {
    const link = transferLink(app('ICB'), transfer, 10_000);
    expect(link?.startsWith('vietinbankipay://host.qrTransfer?targetPage=QRPay&qrContent=')).toBe(
      true,
    );
  });

  it('has no link for banks that take only a partner token', () => {
    expect(transferLink(app('VCB'), transfer, 10_000)).toBeNull();
    expect(transferLink(app('VBA'), transfer, 10_000)).toBeNull();
  });

  it('sends Nam A the fields as base64 JSON, accents intact', () => {
    const noted = scan(
      encodeVietQR({ bin: '970403', account: '060101453998', amount: 10_000, note: 'cà phê' }),
    );
    const link = transferLink(app('NAB'), noted, 10_000);
    expect(link?.startsWith('nabtransfermoney://ops.namabank.com.vn/?data=')).toBe(true);
    // {"bankId":"970403","accountNumber":"060101453998","accountName":"","amount":"10000",
    //  "description":"cà phê","partnerName":"6pm","partnerId":""} as UTF-8, in base64.
    expect(link && param(link, 'data')).toBe(
      'eyJiYW5rSWQiOiI5NzA0MDMiLCJhY2NvdW50TnVtYmVyIjoiMDYwMTAxNDUzOTk4IiwiYWNjb3VudE5hbWUiOiIiLCJhbW91bnQiOiIxMDAwMCIsImRlc2NyaXB0aW9uIjoiY8OgIHBow6oiLCJwYXJ0bmVyTmFtZSI6IjZwbSIsInBhcnRuZXJJZCI6IiJ9',
    );
  });

  it('gives Nam A no link for a shop code', () => {
    expect(transferLink(app('NAB'), shop, 10_000)).toBeNull();
  });
});

describe('handoffUrl', () => {
  it('sends the filled-in link to a verified bank', () => {
    expect(handoffUrl(app('MB'), transfer, 10_000)).toBe(transferLink(app('MB'), transfer, 10_000));
  });

  it("opens an unverified bank's home, even when its link is known", () => {
    expect(transferLink(app('TCB'), transfer, 10_000)).not.toBeNull();
    expect(handoffUrl(app('TCB'), transfer, 10_000)).toBe('tcb://');
  });

  it('opens the home of a bank with no link', () => {
    expect(handoffUrl(app('VCB'), transfer, 10_000)).toBe('vietcombankmobile://');
  });
});
