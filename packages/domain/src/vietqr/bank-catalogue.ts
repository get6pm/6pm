import { BANK_DIRECTORY } from './bank-directory';

/** How to open a bank's iOS app for hand-off. The app is opened as is; no amount is passed. */
export interface IosApp {
  /** Native URL scheme, e.g. "mbbank://". Must be listed in LSApplicationQueriesSchemes. */
  scheme: string;
  /** App Store id, for the "not installed" fallback. */
  appStoreId: string;
}

export interface BankInfo {
  /** Stable VietQR code, upper case: "MB", "VCB", "MOMO". */
  id: string;
  /** Six-digit NAPAS BIN (acquirer id in a VietQR), or null for wallets outside NAPAS. */
  bin: string | null;
  /** What the interface shows: "MB Bank", "Vietcombank". */
  shortName: string;
  /** Registered name, in Vietnamese. */
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

/**
 * iOS URL schemes and App Store ids, taken from the VietQR hand-off pages
 * (https://dl.vietqr.io/pay?app=<id>, listed by https://api.vietqr.io/v2/ios-app-deeplinks),
 * fetched 2026-10-10. VIB uses the current MyVIB 2.0 app. Sacombank, MSB, MoMo, ZaloPay and
 * ViettelMoney are not on that list, so they have no hand-off link here.
 */
const IOS_APPS: Readonly<Record<string, IosApp>> = {
  MB: { scheme: 'mbbank://', appStoreId: '1205807363' },
  VCB: { scheme: 'vietcombankmobile://', appStoreId: '561433133' },
  TCB: { scheme: 'tcb://', appStoreId: '1548623362' },
  VPB: { scheme: 'vpbankneo://', appStoreId: '1209349510' },
  ACB: { scheme: 'acbone://', appStoreId: '950141024' },
  BIDV: { scheme: 'bidv.smartbanking.partner://', appStoreId: '1061867449' },
  ICB: { scheme: 'vietinbankipay://', appStoreId: '689963454' },
  VBA: { scheme: 'agribankmobile://', appStoreId: '935944952' },
  TPB: { scheme: 'hydro://', appStoreId: '450464147' },
  VIB: { scheme: 'myvib2://', appStoreId: '1626624790' },
  SHB: { scheme: 'shbmobile://', appStoreId: '1661457183' },
  OCB: { scheme: 'newomni-app://', appStoreId: '6472261202' },
  SEAB: { scheme: 'seamobile://', appStoreId: '846407152' },
  HDB: { scheme: 'hdbankmobile://', appStoreId: '1461658565' },
  CAKE: { scheme: 'cake.vn://', appStoreId: '1551907051' },
  TIMO: { scheme: 'plus://', appStoreId: '1521230347' },
};

function readDirectory(): BankInfo[] {
  return BANK_DIRECTORY.trim()
    .split('\n')
    .map((line): BankInfo => {
      const [bin = '', id = '', short = '', name = ''] = line.split('|');
      return {
        id,
        bin: bin === '' ? null : bin,
        shortName: SHORT_NAMES[id] ?? short,
        name,
        kind: WALLETS.has(id) ? 'wallet' : 'bank',
        color: COLORS[id] ?? null,
        ios: IOS_APPS[id] ?? null,
      };
    });
}

/** Every Vietnamese bank and wallet 6pm knows, in the directory's order. */
export const BANKS: readonly BankInfo[] = readDirectory();

const BY_BIN = new Map(BANKS.flatMap((b) => (b.bin ? [[b.bin, b] as const] : [])));
const BY_ID = new Map(BANKS.map((b) => [b.id, b] as const));

/** The bank a NAPAS BIN belongs to, or null when 6pm does not know it. */
export function findBankByBin(bin: string): BankInfo | null {
  return BY_BIN.get(bin) ?? null;
}

/** A bank or wallet by its code ("MB", "MOMO"), case-insensitive. */
export function findBank(id: string): BankInfo | null {
  return BY_ID.get(id.toUpperCase()) ?? null;
}

/** App Store page for a bank's app, for when its URL scheme cannot be opened. */
export function appStoreUrl(app: IosApp): string {
  return `https://apps.apple.com/vn/app/id${app.appStoreId}`;
}
