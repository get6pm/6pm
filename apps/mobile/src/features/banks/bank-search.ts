import type { BankInfo } from '@6pm/domain';

import { popularity } from './bank-ranking';

/**
 * Other names people know a bank by: its app, its old name, its parent. Searched with the short
 * name, the registered name and the code.
 */
const ALIASES: Readonly<Record<string, string>> = {
  MB: 'mb bank quan doi',
  VCB: 'vcb digibank',
  VBA: 'agribank plus',
  ICB: 'vietinbank ipay',
  STB: 'sacombank pay',
  VPB: 'vpbank neo',
  CAKE: 'cake by vpbank',
  UBANK: 'ubank by vpbank',
  VCCB: 'bvbank ban viet digimi',
  TIMO: 'timo by bvbank',
  MOMO: 'vi momo',
  'US.BOFA': 'boa bofa',
  'US.CHASE': 'jpmorgan',
  'TH.KBANK': 'kbank kasikorn',
  'SG.DBS': 'digibank paylah',
  'JP.YUCHO': 'yucho',
  'KR.KB': 'kookmin star banking',
  'IN.SBI': 'yono',
  ZALOPAY: 'vi zalopay zalo',
  VTLMONEY: 'viettel money viettelpay',
  VNPTMONEY: 'vnpt pay',
  KBANK: 'kasikornbank k plus',
  SHBVN: 'shinhan sol',
  WVN: 'woori won',
  LPB: 'lienvietpostbank lien viet',
  PVCB: 'pvconnect',
  PVDB: 'pvconnect',
  BVB: 'baoviet bank',
  SGICB: 'saigonbank',
  BAB: 'bac a bank',
  NAB: 'nam a bank',
  VAB: 'viet a bank',
  HDB: 'hd bank',
  MSB: 'maritime bank',
  EIB: 'eximbank edigi',
  CBB: 'vietcombank neo cbway',
  VIKKI: 'dong a bank',
  KEBHANAHN: 'hana bank',
  KEBHANAHCM: 'hana bank',
  KBHN: 'kb kookmin',
  KBHCM: 'kb kookmin',
  NHBHN: 'nonghyup nh bank',
  'IBK-HN': 'industrial bank of korea',
  'IBK-HCM': 'industrial bank of korea',
  SCVN: 'standard chartered',
  UOB: 'united overseas tmrw',
  HSBC: 'hsbc',
  CIMB: 'cimb octo',
};

/**
 * Text as a search compares it: no accents (đ as d), lower case, and every run of anything but
 * letters and digits as one space. "Ngân hàng Á Châu" → "ngan hang a chau".
 */
export function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface Indexed {
  readonly bank: BankInfo;
  /** The short name with no spaces: "mbbank". */
  readonly short: string;
  readonly code: string;
  /** Every field, normalised, for word starts. */
  readonly words: readonly string[];
  /** Every field run together, for a match across words ("mb bank" in "mbbank"). */
  readonly compact: string;
}

function index(bank: BankInfo): Indexed {
  const fields = [bank.shortName, bank.id, bank.name, ALIASES[bank.id] ?? ''].map(normalise);
  const words = fields.join(' ').split(' ').filter(Boolean);
  return {
    bank,
    short: (fields[0] ?? '').replaceAll(' ', ''),
    code: (fields[1] ?? '').replaceAll(' ', ''),
    words,
    compact: fields.map((f) => f.replaceAll(' ', '')).join(' '),
  };
}

const cache = new WeakMap<readonly BankInfo[], readonly Indexed[]>();

function indexed(banks: readonly BankInfo[]): readonly Indexed[] {
  const hit = cache.get(banks);
  if (hit) return hit;
  const built = banks.map(index);
  cache.set(banks, built);
  return built;
}

/** How well a bank answers the query: lower is better, null when it does not match. */
function score(entry: Indexed, tokens: readonly string[], whole: string): number | null {
  if (!tokens.every((t) => entry.compact.includes(t))) return null;
  if (entry.short === whole || entry.code === whole) return 0;
  if (entry.short.startsWith(whole) || entry.code.startsWith(whole)) return 1;
  const first = tokens[0] ?? '';
  if (entry.words.some((w) => w.startsWith(first))) return 2;
  return 3;
}

/**
 * The banks that match a search, best first: an exact short name or code, then names that start
 * with it, then any word that starts with it, then anything that contains it; ties go to the more
 * widely used bank. Accents and spacing never matter. An empty query matches nothing.
 */
export function searchBanks(banks: readonly BankInfo[], query: string): BankInfo[] {
  const q = normalise(query);
  if (q === '') return [];
  const tokens = q.split(' ');
  const whole = tokens.join('');
  return indexed(banks)
    .flatMap((entry) => {
      const s = score(entry, tokens, whole);
      return s === null ? [] : [{ entry, s }];
    })
    .sort(
      (a, b) =>
        a.s - b.s ||
        popularity(a.entry.bank.id) - popularity(b.entry.bank.id) ||
        a.entry.bank.shortName.localeCompare(b.entry.bank.shortName),
    )
    .map(({ entry }) => entry.bank);
}
