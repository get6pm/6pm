import type { Vnd } from '../money/format';
import type { IosApp } from './bank-catalogue';
import { encodeVietQR, type VietQRInput } from './encode-vietqr';
import type { VietQR } from './parse-vietqr';
import { utf8 } from './utf8';

/**
 * The VietQR a bank app should open for this payment. The scanned code is passed on untouched when
 * it already asks for this amount, and always for a shop's code, which 6pm must not rewrite. A
 * transfer to a person's account the user typed an amount for is written again with that amount;
 * if it cannot be, the scanned code goes as it is.
 */
export function payloadFor(qr: VietQR, amount: Vnd): string {
  if (qr.amount === amount || qr.service === 'merchant') return qr.raw;
  const input: VietQRInput = { bin: qr.bin, account: qr.account, amount, service: qr.service };
  if (qr.note !== null) input.note = qr.note;
  if (qr.merchantName !== null) input.merchantName = qr.merchantName;
  try {
    return encodeVietQR(input);
  } catch {
    return qr.raw;
  }
}

/**
 * The link that opens this transfer filled in, in the bank app's own form, or null when the bank
 * has no known form for it. Built whether or not the bank is verified; `handoffUrl` decides
 * whether to send it.
 */
export function transferLink(app: IosApp, qr: VietQR, amount: Vnd): string | null {
  const { link } = app;
  if (link === null) return null;
  if (link.kind === 'qrPay') {
    const content = encodeURIComponent(payloadFor(qr, amount));
    return `${app.scheme}${link.path}?targetPage=QRPay&qrContent=${content}`;
  }
  // Nam A takes the fields, not the code, so a shop's code (with fields of its own) cannot go.
  if (qr.service === 'merchant') return null;
  const data = {
    bankId: qr.bin,
    accountNumber: qr.account,
    accountName: qr.merchantName ?? '',
    amount: String(amount),
    description: qr.note ?? '',
    partnerName: '6pm',
    partnerId: '',
  };
  return `${app.scheme}ops.namabank.com.vn/?data=${encodeURIComponent(base64(JSON.stringify(data)))}`;
}

/** What 6pm opens: the filled-in transfer for a verified bank, else the app's home. */
export function handoffUrl(app: IosApp, qr: VietQR, amount: Vnd): string {
  return (app.verified ? transferLink(app, qr, amount) : null) ?? app.scheme;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Standard base64 of a string's UTF-8 bytes (`btoa` takes Latin-1 only). */
function base64(text: string): string {
  const bytes = utf8(text);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    out += ALPHABET.charAt((n >> 18) & 63) + ALPHABET.charAt((n >> 12) & 63);
    out += b === undefined ? '=' : ALPHABET.charAt((n >> 6) & 63);
    out += c === undefined ? '=' : ALPHABET.charAt(n & 63);
  }
  return out;
}
