/** The wallet code for money that never touches a bank. */
export const CASH = 'CASH';

/**
 * Banks and wallets by how many people in Vietnam use them, most first: an editorial order from
 * public retail-customer counts and app-store rankings, not a measurement. Anything not here
 * ranks after it.
 */
export const POPULAR: readonly string[] = [
  'MB',
  'VCB',
  'TCB',
  'BIDV',
  'ICB',
  'VBA',
  'MOMO',
  'VPB',
  'ACB',
  'TPB',
  'ZALOPAY',
  'STB',
  'VIB',
  'CAKE',
  'HDB',
  'SHB',
  'TIMO',
  'VTLMONEY',
  'MSB',
  'OCB',
  'SEAB',
  'LPB',
  'EIB',
  'VCCB',
  'NAB',
  'VIKKI',
  'BAB',
  'PVCB',
  'ABB',
  'KLB',
];

/**
 * Banks from abroad with branches in Vietnam, by their home country (ISO 3166 alpha-2). One
 * branch of a bank is suggested; the full list carries the other.
 */
const HOME_BANKS: Readonly<Record<string, readonly string[]>> = {
  KR: ['SHBVN', 'WVN', 'IBK-HCM', 'KBHCM', 'KEBHANAHCM', 'NHBHN'],
  TH: ['KBANK'],
  SG: ['UOB', 'DBS'],
  MY: ['CIMB', 'HLBVN', 'PBVN'],
  GB: ['HSBC', 'SCVN'],
  HK: ['HSBC'],
  US: ['CITIBANK'],
  RU: ['VRB'],
};

const CURRENCY_COUNTRY: Readonly<Record<string, string>> = {
  VND: 'VN',
  KRW: 'KR',
  THB: 'TH',
  SGD: 'SG',
  MYR: 'MY',
  GBP: 'GB',
  HKD: 'HK',
  USD: 'US',
  RUB: 'RU',
};

const ZONE_COUNTRY: Readonly<Record<string, string>> = {
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Saigon': 'VN',
  'Asia/Seoul': 'KR',
  'Asia/Bangkok': 'TH',
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'Europe/London': 'GB',
  'Asia/Hong_Kong': 'HK',
  'Europe/Moscow': 'RU',
};

/** What the phone says about where its owner is from and where it is, without asking for location. */
export interface DeviceRegion {
  /** The region in the phone's language and region settings ("VN", "KR"). */
  readonly region: string | null;
  /** That region's currency ("VND"). */
  readonly currency: string | null;
  /** The clock's time zone, which follows where the phone is ("Asia/Ho_Chi_Minh"). */
  readonly timeZone: string | null;
}

/** How strongly the phone points at each country: one point per signal (region, currency, clock). */
export function countrySignals(device: DeviceRegion): ReadonlyMap<string, number> {
  const votes = [
    device.region?.toUpperCase() ?? null,
    device.currency ? (CURRENCY_COUNTRY[device.currency.toUpperCase()] ?? null) : null,
    device.timeZone ? (ZONE_COUNTRY[device.timeZone] ?? null) : null,
  ];
  const out = new Map<string, number>();
  for (const country of votes) if (country) out.set(country, (out.get(country) ?? 0) + 1);
  return out;
}

const RANK = new Map(POPULAR.map((id, i) => [id, i] as const));

/** A bank's place in the popularity order; banks outside it share the last place. */
export function popularity(id: string): number {
  return RANK.get(id) ?? POPULAR.length;
}

/** At most this many banks from abroad lead the suggestions, so the big local banks still show. */
const MAX_HOME = 3;

/**
 * The banks to suggest, best first: banks from the countries the phone points at (strongest
 * signal first, then their own order), then Vietnam's most used banks and wallets.
 */
export function suggestedBanks(device: DeviceRegion, count: number): string[] {
  const signals = [...countrySignals(device)].sort((a, b) => b[1] - a[1]);
  const home = signals.flatMap(([country]) => HOME_BANKS[country] ?? []).slice(0, MAX_HOME);
  return [...new Set([...home, ...POPULAR])].slice(0, count);
}

/** The quick-pick grid is three across and never fewer than two rows. */
const COLUMNS = 3;
const MIN_TILES = 6;

/**
 * The quick-pick grid at the top of the picker: cash, the banks already chosen (so they are in
 * reach when changing them later), then suggestions, filling whole rows of three. Taken once when
 * the picker opens, so tiles never move under the finger.
 */
export function quickPicks(
  chosen: readonly string[],
  device: DeviceRegion,
  known: (id: string) => boolean,
): string[] {
  const own = [...new Set(chosen)].filter((id) => id !== CASH && known(id));
  const size = Math.max(MIN_TILES, Math.ceil((own.length + 1) / COLUMNS) * COLUMNS);
  const suggestions = suggestedBanks(device, size).filter(known);
  return [...new Set([CASH, ...own, ...suggestions])].slice(0, size);
}
