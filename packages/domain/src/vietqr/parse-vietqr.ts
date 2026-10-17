import type { Vnd } from '../money/format';
import { findBankByBin, type BankInfo } from './bank-catalogue';
import { crc16CcittFalse } from './crc16';
import { detectForeign, merchantGuids, type ForeignScheme } from './foreign-scheme';
import { readOtherPayment } from './other-payment';
import { parseTlv, type LengthUnit, type TlvFields } from './tlv';

/** NAPAS's globally unique id in the VietQR merchant account template (tag 38). */
export const NAPAS_GUID = 'A000000727';

/** What a VietQR pays into: a bank account, a card number, or a merchant (NAPAS QR payment). */
export type VietQRService = 'account' | 'card' | 'merchant';

const SERVICES: Readonly<Record<string, VietQRService>> = {
  QRIBFTTA: 'account',
  QRIBFTTC: 'card',
  QRPUSH: 'merchant',
};

export interface VietQR {
  ok: true;
  kind: 'vietqr';
  /** The receiving bank, or null when its BIN is not in the catalogue. */
  bank: BankInfo | null;
  /** NAPAS BIN of the receiving bank (acquirer). */
  bin: string;
  /** Account number, card number or merchant id, as written in the QR. */
  account: string;
  /** "•••• 4821": the last four characters, for display. */
  accountMasked: string;
  service: VietQRService;
  /** Amount in đồng when the QR carries one. */
  amount: Vnd | null;
  /** Purpose of transaction (tag 62, sub-tag 08), the "Note from the QR". */
  note: string | null;
  merchantName: string | null;
  city: string | null;
  /** Merchant category code (tag 52). */
  mcc: string | null;
  billNumber: string | null;
  referenceLabel: string | null;
  /** True for a one-off QR (point of initiation 12), false for a reusable one. */
  dynamic: boolean;
  /** The payload as scanned, trimmed. */
  raw: string;
}

export type VietQRFailureReason = 'not_emv' | 'bad_crc' | 'foreign' | 'unsupported' | 'malformed';

export interface VietQRFailure {
  ok: false;
  reason: VietQRFailureReason;
  /** For a foreign QR: ISO 3166-1 alpha-2 country. */
  country?: string;
  scheme?: ForeignScheme;
  /** For a foreign QR, so it can be logged by hand: amount as written, in its own currency. */
  amount?: string;
  /**
   * ISO 4217 currency from the QR: numeric from an EMV QR's tag 53 ("764" for baht), alphabetic
   * from a code of another kind ("INR").
   */
  currency?: string;
  merchantName?: string;
}

export type VietQRResult = VietQR | VietQRFailure;

const CRC_TAIL = /6304([0-9A-Fa-f]{4})$/;
/** A NAPAS BIN: six digits. */
export const BIN = /^\d{6}$/;
/** Account, card or merchant id: up to 19 letters and digits (NAPAS consumer id). */
export const ACCOUNT = /^[0-9A-Za-z]{1,19}$/;
const AMOUNT = /^(\d{1,13})(?:\.0*)?$/;

/** "•••• 4821": the last four characters of an account, card or merchant id. */
export function maskAccount(account: string): string {
  return `•••• ${account.slice(-4)}`;
}

/**
 * Reads a scanned QR payload. Accepts VietQR (NAPAS 247, EMVCo merchant-presented mode) and
 * tells everything else apart: not a payment code, a broken checksum, another country's payment
 * QR (an EMV scheme such as PromptPay or QRIS, or a code of its own such as UPI or a SEPA
 * transfer), an EMV QR 6pm cannot pay, or a damaged one.
 */
export function parseVietQR(input: string): VietQRResult {
  const raw = input.trim();
  if (!raw.startsWith('0002')) {
    const other = readOtherPayment(raw);
    return other ? { ok: false, reason: 'foreign', ...other } : fail('not_emv');
  }
  if (!raw.startsWith('000201')) return fail('malformed');
  const tail = CRC_TAIL.exec(raw);
  if (!tail?.[1]) return fail('malformed');
  if (crc16CcittFalse(raw.slice(0, -4)) !== tail[1].toUpperCase()) return fail('bad_crc');

  const read = readFields(raw);
  if (!read) return fail('malformed');
  const { fields, unit } = read;

  const napas = findNapasTemplate(fields, unit);
  if (!napas) {
    const foreign = detectForeign(fields, merchantGuids(fields, unit));
    return foreign
      ? { ok: false, reason: 'foreign', ...foreign, ...foreignDetails(fields) }
      : fail('unsupported');
  }
  const currency = fields.get('53');
  const country = fields.get('58')?.toUpperCase();
  if (
    (currency !== undefined && currency !== '704') ||
    (country !== undefined && country !== 'VN')
  ) {
    return fail('unsupported');
  }

  const beneficiary = parseTlv(napas.get('01') ?? '', unit);
  const bin = beneficiary?.get('00');
  const account = beneficiary?.get('01');
  if (!bin || !BIN.test(bin) || !account || !ACCOUNT.test(account)) return fail('malformed');
  // The service code is mandatory in NAPAS's spec; older static codes without one are transfers.
  const service = SERVICES[napas.get('02')?.toUpperCase() ?? 'QRIBFTTA'];
  if (!service) return fail('unsupported');

  const amount = readAmount(fields.get('54'));
  if (amount === undefined) return fail('malformed');
  const additional = fields.has('62')
    ? parseTlv(fields.get('62') ?? '', unit)
    : new Map<string, string>();
  if (!additional) return fail('malformed');

  return {
    ok: true,
    kind: 'vietqr',
    bank: findBankByBin(bin),
    bin,
    account,
    accountMasked: maskAccount(account),
    service,
    amount,
    note: text(additional.get('08')),
    merchantName: text(fields.get('59')),
    city: text(fields.get('60')),
    mcc: text(fields.get('52')),
    billNumber: text(additional.get('01')),
    referenceLabel: text(additional.get('05')),
    dynamic: fields.get('01') === '12',
    raw,
  };
}

function fail(reason: VietQRFailureReason): VietQRFailure {
  return { ok: false, reason };
}

/** Top-level fields, counting lengths in characters first and UTF-8 bytes second. */
function readFields(raw: string): { fields: TlvFields; unit: LengthUnit } | null {
  for (const unit of ['chars', 'bytes'] as const) {
    const fields = parseTlv(raw, unit);
    if (fields && [...fields.keys()].at(-1) === '63') return { fields, unit };
  }
  return null;
}

function findNapasTemplate(fields: TlvFields, unit: LengthUnit): TlvFields | null {
  for (const [tag, value] of fields) {
    const id = Number(tag);
    if (id < 26 || id > 51) continue;
    const template = parseTlv(value, unit);
    if (template?.get('00')?.toUpperCase() === NAPAS_GUID) return template;
  }
  return null;
}

/**
 * Tag 54 in whole đồng. VND has no minor unit, so "55000" and "55000.00" are both 55.000₫;
 * "55000.50" cannot be paid and is undefined (malformed). Absent or zero is null.
 */
function readAmount(value: string | undefined): Vnd | null | undefined {
  if (value === undefined) return null;
  const match = AMOUNT.exec(value);
  if (!match?.[1]) return undefined;
  const amount = Number(match[1]);
  return amount === 0 ? null : amount;
}

function foreignDetails(
  fields: TlvFields,
): Pick<VietQRFailure, 'amount' | 'currency' | 'merchantName'> {
  const details: Pick<VietQRFailure, 'amount' | 'currency' | 'merchantName'> = {};
  const amount = fields.get('54');
  const currency = fields.get('53');
  const merchantName = text(fields.get('59'));
  if (amount) details.amount = amount;
  if (currency) details.currency = currency;
  if (merchantName) details.merchantName = merchantName;
  return details;
}

function text(value: string | undefined): string | null {
  const cleaned = value?.normalize('NFC').trim();
  return cleaned ? cleaned : null;
}
