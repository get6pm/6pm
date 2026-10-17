import { BANK_DIRECTORY } from './bank-directory';
import { WORLD_DIRECTORY } from './world-banks';

/**
 * The link a bank's app takes to open a transfer already filled in.
 * - `qrPay`: `<scheme><path>?targetPage=QRPay&qrContent=<VietQR>`, the form most banks share.
 * - `namABank`: `<scheme>ops.namabank.com.vn/?data=<base64 JSON of account, amount, note>`.
 */
export type HandoffLink =
  { readonly kind: 'qrPay'; readonly path: string } | { readonly kind: 'namABank' };

/** How to open a bank's iOS app for hand-off. */
export interface IosApp {
  /** Native URL scheme, e.g. "mbbank://". Opening it with nothing after shows the app's home. */
  scheme: string;
  /** App Store id, for the "not installed" fallback. */
  appStoreId: string;
  /** The filled-in transfer link, when the bank's format is known; null opens the app as is. */
  link: HandoffLink | null;
  /** The bank was seen to open `link` filled in when 6pm sent it; only then is it sent. */
  verified: boolean;
}

export interface BankInfo {
  /** Stable code, upper case: a VietQR code ("MB", "MOMO"), or a country's ("US.CHASE"). */
  id: string;
  /** Where it banks (ISO 3166-1 alpha-2), or null for a wallet used everywhere ("PAYPAL"). */
  country: string | null;
  /** Six-digit NAPAS BIN (acquirer id in a VietQR), or null for wallets outside NAPAS. */
  bin: string | null;
  /** What the interface shows: "MB Bank", "Vietcombank". */
  shortName: string;
  /** Registered name, in the country's own words. */
  name: string;
  kind: 'bank' | 'wallet';
  /** Monogram colour (sRGB hex), or null for a neutral monogram. */
  color: string | null;
  ios: IosApp | null;
}

const WALLETS = new Set(['MOMO', 'VTLMONEY', 'VNPTMONEY', 'ZALOPAY']);

/** Names that read better than the directory's ("MBBank" → "MB Bank", as the design writes it). */
const SHORT_NAMES: Readonly<Record<string, string>> = { MB: 'MB Bank', CAKE: 'Cake' };

/**
 * Monogram colours: approximations of each brand's primary colour, for a small lettered tile.
 * Not taken from brand guidelines; design may replace them.
 */
const COLORS: Readonly<Record<string, string>> = {
  MB: '#1E3A8A',
  VCB: '#00703C',
  TCB: '#E31B23',
  VPB: '#00A650',
  ACB: '#0B4EA2',
  BIDV: '#00736A',
  ICB: '#005993',
  VBA: '#A6192E',
  STB: '#0066B3',
  TPB: '#5F2580',
  VIB: '#F7941D',
  HDB: '#E30613',
  MSB: '#E2231A',
  SHB: '#F58220',
  OCB: '#008C44',
  SEAB: '#D71920',
  CAKE: '#EC4899',
  TIMO: '#6D28D9',
  MOMO: '#A50064',
  ZALOPAY: '#0068FF',
  VTLMONEY: '#EE0033',
};

const QR_PAY: HandoffLink = { kind: 'qrPay', path: 'applink' };

/** An app 6pm opens as is: the bank takes no transfer link from outside its partners. */
function plain(scheme: string, appStoreId: string): IosApp {
  return { scheme, appStoreId, link: null, verified: false };
}

/** An app whose transfer link is known but not yet seen to open filled in from 6pm. */
function untried(scheme: string, appStoreId: string, link: HandoffLink = QR_PAY): IosApp {
  return { scheme, appStoreId, link, verified: false };
}

/**
 * iOS URL schemes, App Store ids and transfer links, from the bank list Zalo's "pay in a bank
 * app" reads and the links Zalo sent each app when a VietQR was paid through it (2026-10-14).
 * Zalo signs its links; MB opened 6pm's unsigned link filled in and a transfer completed, so MB is
 * the one verified bank. Vietcombank and Agribank take only a token their partner issues, so they
 * open as is. Apps outside that list keep their VietQR hand-off scheme
 * (https://api.vietqr.io/v2/ios-app-deeplinks, 2026-10-10); the banks that list sends only to its
 * own pages open as is, with the scheme those pages open (2026-10-17). MoMo and ZaloPay open as is
 * by the schemes their payment SDKs query; ViettelMoney and VNPT Money publish none.
 */
const IOS_APPS: Readonly<Record<string, IosApp>> = {
  MB: { scheme: 'mbbank://', appStoreId: '1205807363', link: QR_PAY, verified: true },
  VCB: plain('vietcombankmobile://', '561433133'),
  VBA: plain('agribankmobile://', '935944952'),
  TCB: untried('tcb://', '1548623362'),
  VPB: untried('vpbankneo://', '1209349510'),
  ACB: untried('acbone://', '950141024'),
  BIDV: untried('dl.bidvsmartbanking.vn://', '1061867449'),
  ICB: untried('vietinbankipay://', '689963454', { kind: 'qrPay', path: 'host.qrTransfer' }),
  STB: untried('sacombankpay://', '1436283663'),
  TPB: untried('hydro://', '450464147'),
  VIB: untried('myvib2://', '1626624790'),
  SHB: untried('saha://', '1661457183'),
  MSB: untried('msbdigibank://', '436134873'),
  OCB: untried('newomni-app://', '6472261202'),
  SEAB: untried('seamobile://', '846407152'),
  HDB: untried('hdbankmobile://', '1461658565'),
  EIB: untried('eximbankomnimobile://', '1571427361'),
  LPB: untried('lv24h://', '1488794748'),
  PVCB: untried('pvcapp://', '6467857410'),
  ABB: untried('vn.abbank.retail://', '6636532294'),
  VCCB: untried('bvb.digimi://', '1526444697'),
  PGB: untried('pgbank.partner://', '1537765475'),
  VAB: untried('zalo.vietaomni://', '6744814738'),
  VIETBANK: untried('vietbankzalo://', '6746633957'),
  MBV: untried('mbv://', '6742386787'),
  WVN: untried('wvbs://', '1501785125'),
  KBANK: untried('kbank.kplusvn://', '1586576195'),
  NAB: untried('nabtransfermoney://', '1456997296', { kind: 'namABank' }),
  CAKE: untried('cake.vn://', '1551907051'),
  TIMO: untried('timo://', '1521230347'),
  // Zalo lists Shinhan's app but no link to it was seen, so it opens as is.
  SHBVN: plain('shinhanglbvnbank://', '1071033810'),
  NCB: plain('ncbizimobile://', '1465217154'),
  SCB: plain('scbmobilebanking://', '954973621'),
  KLB: plain('kienlongbankmobilebanking://', '1562823941'),
  CIMB: plain('cimb://', '1318127958'),
  SGICB: plain('saigonbankmobilebanking://', '1481832587'),
  BVB: plain('baovietmobile://', '1504422967'),
  COOPBANK: plain('coopbankmobile://', '1578445811'),
  PBVN: plain('publicbankmobile://', '1573736472'),
  MOMO: plain('momo://', '918751511'),
  ZALOPAY: plain('zalopay://', '1112407590'),
};

function readDirectory(): BankInfo[] {
  return BANK_DIRECTORY.trim()
    .split('\n')
    .map((line): BankInfo => {
      const [bin = '', id = '', short = '', name = ''] = line.split('|');
      return {
        id,
        country: 'VN',
        bin: bin === '' ? null : bin,
        shortName: SHORT_NAMES[id] ?? short,
        name,
        kind: WALLETS.has(id) ? 'wallet' : 'bank',
        color: COLORS[id] ?? null,
        ios: IOS_APPS[id] ?? null,
      };
    });
}

function readWorld(): BankInfo[] {
  return WORLD_DIRECTORY.trim()
    .split('\n')
    .map((line): BankInfo => {
      const [country = '', id = '', short = '', name = '', kind = ''] = line.split('|');
      return {
        id,
        country: country === '*' ? null : country,
        bin: null,
        shortName: short,
        name,
        kind: kind === 'wallet' ? 'wallet' : 'bank',
        color: null,
        ios: null,
      };
    });
}

/** Every Vietnamese bank and wallet 6pm knows, in the directory's order. */
export const BANKS: readonly BankInfo[] = readDirectory();

/** The main banks and wallets of other countries, most used first in each; then those of everywhere. */
export const WORLD_BANKS: readonly BankInfo[] = readWorld();

const BY_BIN = new Map(BANKS.flatMap((b) => (b.bin ? [[b.bin, b] as const] : [])));
const BY_ID = new Map([...BANKS, ...WORLD_BANKS].map((b) => [b.id, b] as const));

/**
 * The banks and wallets of a country (ISO 3166-1 alpha-2), most used first, with the wallets used
 * everywhere after a country's own; empty for a country 6pm has no list for. Vietnam's is `BANKS`.
 */
export function banksOf(country: string): BankInfo[] {
  const code = country.toUpperCase();
  if (code === 'VN') return [...BANKS];
  const own = WORLD_BANKS.filter((b) => b.country === code);
  return own.length === 0 ? [] : [...own, ...WORLD_BANKS.filter((b) => b.country === null)];
}

/** The bank a NAPAS BIN belongs to, or null when 6pm does not know it. */
export function findBankByBin(bin: string): BankInfo | null {
  return BY_BIN.get(bin) ?? null;
}

/** A bank or wallet by its code ("MB", "MOMO", "US.CHASE"), case-insensitive. */
export function findBank(id: string): BankInfo | null {
  return BY_ID.get(id.toUpperCase()) ?? null;
}

/** App Store page for a bank's app, for when it is not on this phone. */
export function appStoreUrl(app: IosApp): string {
  return `https://apps.apple.com/vn/app/id${app.appStoreId}`;
}
