import { parseTlv, type LengthUnit, type TlvFields } from './tlv';

/** Payment QR schemes from other countries that 6pm recognises but cannot pay. */
export type ForeignScheme =
  // EMV QR schemes, told apart by a merchant account GUID or the country code.
  | 'promptpay'
  | 'paynow'
  | 'sgqr'
  | 'duitnow'
  | 'khqr'
  | 'laoqr'
  | 'qris'
  | 'qrph'
  | 'mmqr'
  | 'fps'
  | 'jpqr'
  | 'bharatqr'
  | 'lankaqr'
  | 'banglaqr'
  | 'pix'
  // Codes of their own (`readOtherPayment`).
  | 'upi'
  | 'epc'
  | 'swissqr'
  | 'spayd'
  | 'alipay'
  | 'wechat'
  | 'twqr'
  | 'paypay';

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
 * - QRIS (Indonesia, Bank Indonesia): "ID.CO.QRIS.WWW", the national switching domain.
 * - QR Ph (Philippines, PPMI): "PH.PPMI.P2M…" for shops.
 * - FPS (Hong Kong, HKICL): "HK.COM.HKICL".
 * - Pix (Brazil, Banco Central): "BR.GOV.BCB.PIX".
 */
const GUIDS: readonly { prefix: string; country: string; scheme: ForeignScheme }[] = [
  { prefix: 'A000000677', country: 'TH', scheme: 'promptpay' },
  { prefix: 'SG.PAYNOW', country: 'SG', scheme: 'paynow' },
  { prefix: 'A0000006150001', country: 'MY', scheme: 'duitnow' },
  { prefix: 'ID.CO.QRIS', country: 'ID', scheme: 'qris' },
  { prefix: 'PH.PPMI', country: 'PH', scheme: 'qrph' },
  { prefix: 'HK.COM.HKICL', country: 'HK', scheme: 'fps' },
  { prefix: 'BR.GOV.BCB.PIX', country: 'BR', scheme: 'pix' },
];

/**
 * The national standard every EMV payment QR in these countries follows, named by the country
 * code when no GUID above says more (Cambodia's KHQR carries a Bakong account, not a GUID).
 */
const BY_COUNTRY: Readonly<Record<string, ForeignScheme>> = {
  SG: 'sgqr',
  MY: 'duitnow',
  KH: 'khqr',
  LA: 'laoqr',
  ID: 'qris',
  PH: 'qrph',
  MM: 'mmqr',
  JP: 'jpqr',
  IN: 'bharatqr',
  LK: 'lankaqr',
  BD: 'banglaqr',
  BR: 'pix',
};

/**
 * Countries whose QRs a Vietnamese bank app pays across the border (NAPAS's links with the
 * region's national switches), so a traveller from Vietnam pays them from home.
 */
const PAID_FROM_VIETNAM = new Set(['TH', 'SG', 'MY', 'KH', 'LA']);

/** Whether a Vietnamese bank app takes this country's payment QRs. */
export function paidFromVietnam(country: string | undefined): boolean {
  return country !== undefined && PAID_FROM_VIETNAM.has(country.toUpperCase());
}

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
