import type { Vnd } from '../money/format';
import { crc16CcittFalse } from './crc16';
import { ACCOUNT, BIN, NAPAS_GUID } from './parse-vietqr';
import { encodeTlv } from './tlv';

/** Tag 54 holds at most 13 digits: the most a QR can ask for that `parseVietQR` reads back. */
const MAX_AMOUNT = 9_999_999_999_999;

export interface VietQRInput {
  /** NAPAS BIN of the receiving bank. */
  bin: string;
  /** Account number (or card number with `service: 'card'`). */
  account: string;
  /** Whole đồng. Present makes a one-off (dynamic) QR. */
  amount?: Vnd;
  /** Purpose of transaction, shown to the payer. */
  note?: string;
  merchantName?: string;
  service?: 'account' | 'card';
}

/**
 * Builds a VietQR payload (NAPAS 247 transfer, EMVCo merchant-presented mode) with its CRC.
 * Lengths are counted in characters, as EMVCo specifies. Throws a RangeError for a BIN,
 * account or amount NAPAS would refuse, or a text longer than a field can hold.
 */
export function encodeVietQR(input: VietQRInput): string {
  const { bin, account, amount } = input;
  if (!BIN.test(bin)) throw new RangeError('A VietQR BIN is six digits');
  if (!ACCOUNT.test(account)) throw new RangeError('A VietQR account is 1–19 letters or digits');
  if (
    amount !== undefined &&
    !(Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_AMOUNT)
  ) {
    throw new RangeError('A VietQR amount is a whole number of đồng, at most 13 digits');
  }
  const note = clean(input.note);
  const merchantName = clean(input.merchantName);
  const serviceCode = input.service === 'card' ? 'QRIBFTTC' : 'QRIBFTTA';

  const merchantAccount =
    encodeTlv('00', NAPAS_GUID) +
    encodeTlv('01', encodeTlv('00', bin) + encodeTlv('01', account)) +
    encodeTlv('02', serviceCode);

  const body =
    encodeTlv('00', '01') +
    encodeTlv('01', amount === undefined ? '11' : '12') +
    encodeTlv('38', merchantAccount) +
    encodeTlv('53', '704') +
    (amount === undefined ? '' : encodeTlv('54', String(amount))) +
    encodeTlv('58', 'VN') +
    (merchantName ? encodeTlv('59', merchantName) : '') +
    (note ? encodeTlv('62', encodeTlv('08', note)) : '') +
    '6304';
  return body + crc16CcittFalse(body);
}

function clean(value: string | undefined): string {
  return value?.normalize('NFC').trim() ?? '';
}
