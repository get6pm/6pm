import { parseTlv, type LengthUnit, type TlvFields } from './tlv';

/** National QR payment schemes 6pm recognises but cannot pay. */
export type ForeignScheme = 'promptpay' | 'paynow' | 'duitnow' | 'khqr';

export interface ForeignMatch {
  /** ISO 3166-1 alpha-2 country, from tag 58 or implied by the scheme. */
  country: string;
  scheme?: ForeignScheme;
}

/**
 * Globally unique ids carried in sub-tag 00 of the merchant account templates (tags 26–51).
 * - PromptPay (Thailand, National ITMX): A000000677010111 transfer, …010112 bill payment.
 * - PayNow (Singapore): "SG.PAYNOW".
 * - DuitNow (Malaysia, PayNet): A0000006150001 (PayNet DuitNow QR merchant-presented spec).
 */
const GUIDS: readonly { prefix: string; country: string; scheme: ForeignScheme }[] = [
  { prefix: 'A000000677', country: 'TH', scheme: 'promptpay' },
  { prefix: 'SG.PAYNOW', country: 'SG', scheme: 'paynow' },
  { prefix: 'A0000006150001', country: 'MY', scheme: 'duitnow' },
];

/** Cambodia's KHQR (Bakong) has no GUID; it is told apart by its country code. */
const BY_COUNTRY: Readonly<Record<string, ForeignScheme>> = { KH: 'khqr' };

/** Sub-tag 00 of every merchant account template (tags 26–51) in the payload. */
export function merchantGuids(fields: TlvFields, unit: LengthUnit): string[] {
  const guids: string[] = [];
  for (const [tag, value] of fields) {
    const id = Number(tag);
    if (id < 26 || id > 51) continue;
    const guid = parseTlv(value, unit)?.get('00');
    if (guid) guids.push(guid.toUpperCase());
  }
  return guids;
}

/** A foreign scheme or country, or null when the QR is Vietnamese (or says nothing). */
export function detectForeign(fields: TlvFields, guids: readonly string[]): ForeignMatch | null {
  const country = fields.get('58')?.toUpperCase();
  for (const guid of guids) {
    const known = GUIDS.find((g) => guid.startsWith(g.prefix));
    if (known) return { country: country ?? known.country, scheme: known.scheme };
  }
  if (!country || country === 'VN') return null;
  const scheme = BY_COUNTRY[country];
  return scheme ? { country, scheme } : { country };
}
